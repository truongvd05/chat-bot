import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";

class ConversationService {
    // kiểm tra user có trong cuộc hội thoại hay không và cuộc hội thoại chưa bị xóa
    async _userInConversation(conversationId, userId) {
        const conversation = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId,
                conversation: {
                    deletedAt: null,
                },
            },
        });

        if (!conversation) {
            throw new Error("CONVERSATION_NOT_FOUND");
        }
    }
    // kiểm tra xem user đã ở trong cuộc hội thoại chưa
    async isUserAlreadyInConversation(conversationId, userId) {
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId,
            },
        });
        if (participant) {
            throw new Error("USER_ALREADY_IN_CONVERSATION");
        }
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
                        messages: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
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
        const result = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!result || result.deletedAt) {
            throw new Error("CONVERSATION_NOT_FOUND");
        }
        return serializeBigInt(result);
    }
    async findDirectConversation(userId, targetUserId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                type: "DIRECT",
                participants: {
                    every: {
                        userId: {
                            in: [userId, targetUserId],
                        },
                    },
                },
            },
        });
        return serializeBigInt(conversation);
    }
    async createDirectConversation(userId, targetUserId) {
        if (userId === targetUserId) {
            throw new Error("CANNOT_CHAT_WITH_YOURSELF");
        }
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target) throw new Error("USER_NOT_FOUND");
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

            if (existing && existing.participants.length === 2) {
                return serializeBigInt(existing);
            }

            // 2. Create conversation
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
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation || conversation.deletedAt) {
            throw new Error("CONVERSATION_NOT_FOUND");
        }
        if (conversation.type === "BOT") {
            if (conversation.ownerId !== userId) {
                throw new Error("FORBIDDEN");
            }
        }
        if (conversation.type === "DIRECT") {
            throw new Error("DIRECT_CANNOT_BE_RENAMED");
        }
        const result = await prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: { title },
        });
        return serializeBigInt(result);
    }
    async getMyBotConversations(user) {
        const result = await prisma.conversation.findMany({
            where: {
                ownerId: user.id,
                deletedAt: null,
                type: "BOT",
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        return result.map(serializeBigInt);
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
            throw new Error("CONVERSATION_NOT_FOUND");
        }
        return conversation;
    }

    async deleteConversation(userId, conversationId) {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation || conversation.deletedAt) {
            throw new Error("CONVERSATION_NOT_FOUND");
        }
        if (conversation.type === "BOT") {
            if (conversation.ownerId !== userId) {
                throw new Error("FORBIDDEN");
            }
        }
        if (conversation.type === "DIRECT") {
            throw new Error("DIRECT_CANNOT_BE_RENAMED");
        }
        const deleted = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                deletedAt: new Date(),
            },
        });
        return serializeBigInt(deleted);
    }
    async addParticipant(userId, conversationId, targetUserId) {
        await this._userInConversation(conversationId, userId);
        await this.isUserAlreadyInConversation(conversationId, userId);
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId,
            },
        });
        if (conversation.type === "DIRECT") {
            throw new Error("Cannot add to direct chat");
        }
        const participant = await prisma.conversationParticipant.update({
            data: {
                conversationId,
                userId: targetUserId,
            },
        });
        return participant;
    }
}

export default new ConversationService();
