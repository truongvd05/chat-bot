import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import formatChatItem from "#utils/formatChatItem.js";
import { serializeBigInt } from "#utils/serialize.js";

const allowedRoles = ["OWNER"];

class ConversationService {
    // kiểm tra user có trong cuộc hội thoại hay không
    async _userInConversation(conversationId, userId) {
        // check nếu conversation là bot thì không có bảng quan hệ với conversationParticipant
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { id: true, type: true },
        });

        if (!conversation) {
            throw new AppError("Conversation not found", HTTP_STATUS.NOT_FOUND);
        }

        // ✅ Nếu là bot thì không cần check participant
        if (conversation.type === "BOT") {
            return true;
        }
        // còn lại thì check
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId, userId },
            },
        });
        console.log(participant);

        if (!participant || participant.leftAt) {
            throw new AppError(
                "User not found in conversation",
                HTTP_STATUS.NOT_FOUND,
            );
        }

        return participant;
    }
    // kiểm tra conversation có tồn tại hay đã xóa chưa
    async _exitedConversation(conversationId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                deletedAt: null,
            },
            include: {
                lastMessage: true,
            },
        });
        if (!conversation) {
            throw new AppError("CONVERSATION_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        }
        return conversation;
    }
    async createBotConversation(user) {
        const conversation = await prisma.conversation.create({
            data: {
                ownerId: user.id,
                title: "New Conversation",
                type: "BOT",
            },
        });
        return serializeBigInt(conversation);
    }

    async getConversations(userId) {
        const rows = await prisma.conversationParticipant.findMany({
            where: {
                userId,
                conversation: {
                    type: { in: ["DIRECT", "GROUP"] },
                    deletedAt: null,
                },
                leftAt: null,
            },
            include: {
                conversation: {
                    include: {
                        participants: {
                            where: {
                                userId: { not: userId },
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        lastMessage: {
                            select: {
                                id: true,
                                content: true,
                                createdAt: true,
                                userId: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                conversation: {
                    updatedAt: "desc",
                },
            },
        });
        const result = rows.map((row) =>
            formatChatItem(row.conversation, userId),
        );
        return serializeBigInt(result);
    }
    async getConversation(userId, conversationId) {
        await this._userInConversation(conversationId, userId);
        const result = await this._exitedConversation(conversationId);
        return serializeBigInt(result);
    }
    async findDirectConversation(userId, targetUserId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                type: "DIRECT",
                deletedAt: null,
                AND: [
                    { participants: { some: { userId } } },
                    { participants: { some: { userId: targetUserId } } },
                ],
            },
        });
        if (!conversation) {
            throw new AppError(
                "CONNOT_FIND_CONVERSATION",
                HTTP_STATUS.NOT_FOUND,
            );
        }
        return serializeBigInt(conversation);
    }
    async createGroupConversation(userId, title) {
        return prisma.$transaction(async (tx) => {
            const conversation = await tx.conversation.create({
                data: {
                    ownerId: userId,
                    title,
                    type: "GROUP",
                },
            });
            await tx.conversationParticipant.create({
                data: {
                    conversationId: conversation.id,
                    userId,
                    role: "OWNER",
                },
            });
            return serializeBigInt(conversation);
        });
    }
    async createDirectConversation(userId, targetUserId) {
        if (userId === targetUserId) {
            throw new AppError(
                "CANNOT_CHAT_WITH_YOURSELF",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target)
            throw new AppError("USER_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        // dùng transaction để tránh race condition
        return prisma.$transaction(async (tx) => {
            // 1. Check  conversation tồn tại chưa
            const existing = await tx.conversation.findFirst({
                where: {
                    type: "DIRECT",
                    deletedAt: null,
                    AND: [
                        { participants: { some: { userId } } },
                        { participants: { some: { userId: targetUserId } } },
                    ],
                },
                select: {
                    id: true,
                    type: true,
                    createdAt: true,
                    updatedAt: true,
                    participants: {
                        select: { userId: true },
                    },
                },
            });

            if (existing) {
                return serializeBigInt(existing);
            }

            // 2. Chưa có thì tạo conversation
            const conversation = await tx.conversation.create({
                data: {
                    type: "DIRECT",
                    participants: {
                        createMany: {
                            data: [{ userId }, { userId: targetUserId }],
                        },
                    },
                },
            });
            return serializeBigInt(conversation);
        });
    }

    async renameConversation(userId, conversationId, title) {
        const user = await this._userInConversation(conversationId, userId);

        const conversation = await this._exitedConversation(conversationId);

        if (conversation.type === "BOT") {
            if (conversation.ownerId !== userId) {
                throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);
            }
        }
        if (conversation.type === "DIRECT") {
            throw new AppError(
                "DIRECT_CANNOT_BE_RENAMED",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        if (!allowedRoles.includes(user.role))
            throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);

        const result = await prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: { title },
        });
        return serializeBigInt(result);
    }
    async getMyBotConversations(user) {
        const rows = await prisma.conversation.findMany({
            where: {
                ownerId: user.id,
                deletedAt: null,
                type: "BOT",
            },
            orderBy: {
                updatedAt: "desc",
            },
            include: {
                lastMessage: true,
            },
        });
        return serializeBigInt(rows);
    }
    async getMyBotConversation(userId, conversationId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                ownerId: userId,
                deletedAt: null,
                type: "BOT",
            },
        });
        if (!conversation) {
            throw new AppError("CONVERSATION_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        }
        return serializeBigInt(conversation);
    }

    async searchConversation(userId, keyword) {
        return prisma.conversation.findMany({
            where: {
                deletedAt: null,
                type: {
                    in: ["DIRECT", "GROUP"],
                },
                participants: {
                    some: {
                        userId,
                        leftAt: null,
                    },
                },
                title: {
                    contains: keyword,
                    mode: "insensitive",
                },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    }

    async deleteConversation(userId, conversationId) {
        const conversation = await this._exitedConversation(conversationId);

        if (conversation.type === "BOT") {
            if (conversation.ownerId !== userId) {
                throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);
            }
            const deleted = await prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    deletedAt: new Date(),
                },
            });
            return serializeBigInt(deleted);
        }
        if (conversation.type === "GROUP") {
            const user = await prisma.conversationParticipant.findFirst({
                where: {
                    conversationId: conversation.id,
                    userId,
                },
                select: {
                    leftAt: true,
                    role: true,
                },
            });
            if (!user) {
                throw new AppError("NOT_MEMBER", HTTP_STATUS.FORBIDDEN);
            }
            if (user.leftAt) {
                throw new AppError(
                    "ALREADY_LEFT_GROUP",
                    HTTP_STATUS.BAD_REQUEST,
                );
            }
            if (allowedRoles.includes(user.role)) {
                // chỉ được xóa (rời nhóm) nếu có 2 owner trở lên
                const otherOwners = await prisma.conversationParticipant.count({
                    where: {
                        conversationId: conversation.id,
                        role: "OWNER",
                        leftAt: null,
                        NOT: {
                            userId,
                        },
                    },
                });

                if (otherOwners === 0) {
                    throw new AppError(
                        "OWNER_MUST_TRANSFER_BEFORE_LEAVE",
                        HTTP_STATUS.FORBIDDEN,
                    );
                }
                return await prisma.conversationParticipant.update({
                    where: {
                        conversationId_userId: {
                            conversationId: conversation.id,
                            userId,
                        },
                    },
                    data: {
                        leftAt: new Date(),
                    },
                });
            }
        }
    }
    async addParticipant(userId, conversationId, targetUserId) {
        if (userId === targetUserId) {
            throw new AppError("CANNOT_ADD_YOURSELF", HTTP_STATUS.BAD_REQUEST);
        }
        const target = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId, userId: targetUserId },
            },
        });
        if (!target)
            throw new AppError("TARGET_NOT_FOUND", HTTP_STATUS.NOT_FOUND);

        const user = await this._userInConversation(conversationId, userId);

        const conversation = await this._exitedConversation(conversationId);
        if (conversation.type === "DIRECT")
            throw new AppError(
                "CANNOT_ADD_DIRECT_CHAT",
                HTTP_STATUS.BAD_REQUEST,
            );

        if (!allowedRoles.includes(user.role))
            throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);

        const existing = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: targetUserId,
                },
            },
        });

        if (existing && existing.leftAt === null) {
            throw new AppError(
                "USER_ALREADY_IN_GROUP",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        // thêm lại thì update leftAt, vào lần đầu thi tạo mới
        const participant = await prisma.conversationParticipant.upsert({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: targetUserId,
                },
            },
            update: {
                leftAt: null,
                joinedAt: new Date(),
            },
            create: {
                conversationId,
                userId: targetUserId,
                role: "MEMBER",
                joinedAt: new Date(),
            },
        });
        return participant;
    }
    async removeParticipant(userId, conversationId, targetUserId) {
        if (userId === targetUserId) {
            throw new AppError("CANNOT_KICK_YOURSELF", HTTP_STATUS.BAD_REQUEST);
        }
        const user = await this._userInConversation(conversationId, userId);
        const target = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: targetUserId,
                },
            },
        });
        if (!target || target.leftAt)
            throw new AppError("TARGET_NOT_IN_CONVERSATION");

        if (!allowedRoles.includes(user.role))
            throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);

        const conversation = await this._exitedConversation(conversationId);

        if (conversation.type === "DIRECT") {
            throw new AppError(
                "Cannot kick in direct chat",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        return prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: targetUserId,
                },
            },
            data: {
                leftAt: new Date(),
            },
        });
    }
}

export default new ConversationService();
