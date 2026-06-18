import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import { requireVerifiedUser } from "#permissions/user.permission.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";
import { ensureConversationMember } from "#permissions/conversation.permission.js";
import { emitStatsUpdate } from "#socket/admin.socket.js";
import { getIO } from "#libs/socket.instance.js";

class ConversationService {
    async findById(id, userId) {
        const result = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: {
                    where: { deletedAt: null, leftAt: null },
                    select: {
                        userId: true,
                        unreadCount: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                lastMessage: {
                    select: {
                        id: true,
                        conversationId: true,
                        parentMessageId: true,
                        userId: true,
                        content: true,
                        role: true,
                        createdAt: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
        return serializeBigInt(result);
    }
    async _getExistingMembersMap(tx, conversationId, memberIds) {
        const existing = await tx.conversationParticipant.findMany({
            where: { conversationId, userId: { in: memberIds } },
            include: {
                user: {
                    select: {
                        emailVerifiedAt: true,
                    },
                },
            },
        });
        return new Map(existing.map((m) => [m.userId, m]));
    }
    // lọc members
    _filterMembers(memberIds, excludeId) {
        return [...new Set(memberIds)].filter((id) => id !== excludeId);
    }
    // check quyền OWNER Và ADMIN
    async _requireRole(
        conversationId,
        userId,
        allowedRoles = ["OWNER", "ADMIN"],
    ) {
        const { conversation, participant } = await ensureConversationMember(
            conversationId,
            userId,
        );

        if (conversation.type === "DIRECT") {
            throw new AppError(
                "NOT_ALLOWED_IN_DIRECT",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        if (!allowedRoles.includes(participant.role)) {
            throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);
        }

        return {
            conversation,
            participant,
        };
    }
    async markAsRead(conversationId, userId) {
        await prisma.conversationParticipant.updateMany({
            where: { conversationId, userId },
            data: { unreadCount: 0 },
        });
    }
    async getConversations(userId) {
        const rows = await prisma.conversationParticipant.findMany({
            where: {
                userId,
                conversation: {
                    type: { in: ["DIRECT", "GROUP", "SELF"] },
                    deletedAt: null,
                },
                leftAt: null,
            },
            include: {
                conversation: {
                    include: {
                        participants: {
                            where: {
                                leftAt: null,
                            },
                            select: {
                                unreadCount: true,
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
                    },
                },
            },
            orderBy: {
                conversation: {
                    updatedAt: "desc",
                },
            },
        });
        const result = rows.map((row) => serializeBigInt(row.conversation));
        return result;
    }
    async getConversation(userId, conversationId) {
        await ensureConversationMember(conversationId, userId);
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                deletedAt: null,
            },
            include: {
                lastMessage: true,
                participants: {
                    where: {
                        conversationId,
                        leftAt: null,
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
            },
        });

        if (!conversation) {
            throw new AppError("CONVERSATION_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        }

        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    userId: userId,
                    conversationId: conversationId,
                },
            },
            data: {
                unreadCount: 0,
                lastReadAt: new Date(),
            },
        });
        return serializeBigInt(conversation);
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
    async createGroupConversation(userId, title, memberIds) {
        await requireVerifiedUser(userId);
        const uniqueMembers = this._filterMembers(memberIds, userId);
        const newGroupConversation = await prisma.conversation.create({
            data: {
                title,
                type: "GROUP",
                ownerId: userId,
                participants: {
                    create: [
                        {
                            userId,
                            role: "ADMIN",
                        },
                        ...uniqueMembers.map((id) => ({
                            userId: id,
                            role: "MEMBER",
                        })),
                    ],
                },
            },
        });

        emitStatsUpdate(getIO()).catch(console.error);
        return serializeBigInt(newGroupConversation);
    }
    async createDirectConversation(userId, targetUserId) {
        await requireVerifiedUser(userId);
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
        const { conversation } = await this._requireRole(
            conversationId,
            userId,
        );

        const result = await prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: { title },
        });
        return serializeBigInt(result);
    }

    async searchConversation(userId, keyword) {
        const result = await prisma.conversation.findMany({
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
        serializeBigInt(result);
    }

    async deleteConversation(userId, conversationId) {
        const { conversation } = await ensureConversationMember(
            conversationId,
            userId,
        );
        // logic delete
    }
    async addParticipant(userId, conversationId, memberIds, io) {
        return await prisma.$transaction(async (tx) => {
            await this._requireRole(conversationId, userId);
            const uniqueMembers = this._filterMembers(memberIds, userId);
            const existingMap = await this._getExistingMembersMap(
                tx,
                conversationId,
                uniqueMembers,
            );
            const results = [];

            for (const memberId of uniqueMembers) {
                const existing = existingMap.get(memberId);

                // nếu đã trong group thì skip
                if (existing && existing.leftAt === null) continue;

                const participant = await tx.conversationParticipant.upsert({
                    where: {
                        conversationId_userId: {
                            conversationId,
                            userId: memberId,
                        },
                    },
                    update: {
                        leftAt: null,
                        joinedAt: new Date(),
                    },
                    create: {
                        conversationId,
                        userId: memberId,
                        role: "MEMBER",
                        joinedAt: new Date(),
                    },
                });

                results.push(participant);
            }
            // emit socket add user
            const participants = serializeBigInt(
                await this.finDparticipants(conversationId),
            );

            const payload = serializeBigInt({
                conversationId,
                addedBy: userId,
                member: uniqueMembers,
                action: "add",
            });

            for (const p of participants) {
                io.to(`user_${p.userId}`).emit("group_event", payload);
            }

            return serializeBigInt(results);
        });
    }

    async getGroupConversation(userId) {
        const groupConversation = await prisma.conversation.findMany({
            where: {
                deletedAt: null,
                type: "GROUP",
                participants: {
                    some: {
                        userId,
                        leftAt: null,
                    },
                },
            },
        });
        return serializeBigInt(groupConversation);
    }

    async removeParticipant(userId, conversationId, memberIds, io) {
        return await prisma.$transaction(async (tx) => {
            await this._requireRole(conversationId, userId);
            const uniqueMembers = this._filterMembers(memberIds, userId);
            const existingMap = await this._getExistingMembersMap(
                tx,
                conversationId,
                uniqueMembers,
            );
            const results = [];

            for (const memberId of uniqueMembers) {
                const existing = existingMap.get(memberId);

                // nếu đã left rồi thì skip
                if (!existing || existing.leftAt) continue;

                const participant = await tx.conversationParticipant.update({
                    where: {
                        conversationId_userId: {
                            conversationId,
                            userId: memberId,
                        },
                    },
                    data: {
                        role: "MEMBER",
                        leftAt: new Date(),
                    },
                });

                results.push(participant);
            }

            // emit socket
            const participants = await this.finDparticipants(conversationId);

            const payload = serializeBigInt({
                conversationId,
                removedBy: userId,
                member: memberIds,
                action: "kick",
            });

            for (const p of participants) {
                io.to(`user_${p.userId}`).emit("group_event", payload);
            }

            return serializeBigInt(results);
        });
    }
    async promoteToAdmin(userId, conversationId, memberIds, io) {
        return await prisma.$transaction(async (tx) => {
            await this._requireRole(conversationId, userId);
            const uniqueMembers = this._filterMembers(memberIds, userId);
            const existingMap = await this._getExistingMembersMap(
                tx,
                conversationId,
                uniqueMembers,
            );
            const results = [];

            for (const memberId of uniqueMembers) {
                const existing = existingMap.get(memberId);

                // nếu đã là admin và rời nhóm rồi thì skip
                if (!existing || existing.role === "ADMIN" || existing.leftAt)
                    continue;

                if (!existing.user?.emailVerifiedAt) {
                    throw new AppError(
                        "Người dùng này chưa xác thực",
                        HTTP_STATUS.FORBIDDEN,
                    );
                }

                const participant = await tx.conversationParticipant.update({
                    where: {
                        conversationId_userId: {
                            conversationId,
                            userId: memberId,
                        },
                    },
                    data: {
                        role: "ADMIN",
                    },
                });

                results.push(participant);
            }
            const participants = serializeBigInt(
                await this.finDparticipants(conversationId),
            );

            const payload = serializeBigInt({
                conversationId,
                promotedBy: userId,
                member: memberIds,
                action: "promote",
            });

            for (const p of participants) {
                io.to(`user_${p.userId}`).emit("group_event", payload);
            }

            return serializeBigInt(results);
        });
    }

    async finDparticipants(conversationId) {
        const result = await prisma.conversationParticipant.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true },
        });
        return serializeBigInt(result);
    }
    async findConversationSocket(conversationId) {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                lastMessage: {
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
                participants: {
                    where: {
                        leftAt: null,
                    },
                    select: {
                        unreadCount: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        return serializeBigInt(conversation);
    }

    async searchAvailableUsers(userId, conversationId, q) {
        await ensureConversationMember(conversationId, userId);

        // Lấy tất cả member đang còn trong nhóm (leftAt = null)
        const members = await prisma.conversationParticipant.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true, role: true },
        });

        const memberIds = members.map((m) => m.userId);

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phonenumber: { contains: q } },
                    { email: { contains: q } },
                ],
                id: { notIn: [...memberIds, userId] },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (!user)
            throw new AppError("user not found", HTTP_STATUS.BAD_REQUEST);
        return serializeBigInt(user);
    }
    async leaveGroup(userId, conversationId, io) {
        const { participant } = await ensureConversationMember(
            conversationId,
            userId,
        );

        const members = await prisma.conversationParticipant.findMany({
            where: { conversationId, leftAt: null },
            select: { userId: true, role: true },
        });

        const adminCount = members.filter((m) => m.role === "ADMIN").length;

        if (participant.role === "ADMIN" && adminCount <= 1) {
            throw new AppError(
                "Bạn là admin duy nhất",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const leave = await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    userId,
                    conversationId,
                },
            },
            data: {
                leftAt: new Date(),
                role: "MEMBER",
            },
        });

        const participants = serializeBigInt(
            await this.finDparticipants(conversationId),
        );

        const payload = serializeBigInt({
            conversationId,
            member: [userId],
            action: "leave",
        });

        for (const p of participants) {
            io.to(`user_${p.userId}`).emit("group_event", payload);
        }

        return serializeBigInt(leave);
    }
}

export default new ConversationService();
