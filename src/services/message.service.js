import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";
import uploadBuffer from "#utils/uploadCoud.js";
import conversationService from "./conversation.service.js";

class MessageService {
    // kiểm tra user có trong cuộc hội thoại hay không và cuộc hộc thoại đã bị xóa chưa
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
        const exists = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId,
                conversation: {
                    deletedAt: null,
                },
            },
        });

        if (!exists) {
            throw new AppError("Conversation not found");
        }
    }
    // kiểm tra xem message có phải của user hay không
    async _assertUserOwnsActiveMessage(messageId, userId) {
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                userId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });
        if (!message) {
            throw new AppError("MESSAGE_NOT_FOUND_OR_FORBIDDEN");
        }
    }
    async getForAi(conversationId, limit = 10) {
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
            },
            orderBy: {
                createdAt: "asc",
            },
            take: -limit,
        });
        return messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
        }));
    }
    async verifyAccess(conversationId, userId) {
        await this._userInConversation(conversationId, userId);
        return true;
    }
    async deleteMessage(userId, messageId) {
        await this._assertUserOwnsActiveMessage(messageId, userId);

        const update = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                deletedAt: new Date(),
            },
        });
        return serializeBigInt(update);
    }
    async editMessage(userId, messageId, content) {
        await this._assertUserOwnsActiveMessage(messageId, userId);
        const updated = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                content,
                isEdited: true,
                updatedAt: new Date(),
            },
        });
        return serializeBigInt(updated);
    }
    async uploadFile(file) {
        const result = await uploadBuffer(file.buffer, {
            public_id: `${Date.now()}-${file.originalname}`,
        });

        return {
            fileName: file.originalname,
            fileUrl: result.secure_url,
            fileType: file.mimetype,
            fileSize: file.size,
        };
    }
    async sendMessage(conversationId, user, content, files = [], targetUserId) {
        await this._userInConversation(conversationId, user.id);

        const attachments = await Promise.all(
            files.map((f) => this.uploadFile(f)),
        );

        const message = await this._createMessage({
            conversationId,
            userId: user.id,
            content,
            attachments,
        });

        return serializeBigInt(message);
    }

    async _getOrCreateConversation(conversationId, userId, targetUserId) {
        if (conversationId) {
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { participants: true },
            });
            if (conversation) return conversation;
        }
        // Không tìm thấy → tạo mới DIRECT
        if (!targetUserId) {
            throw new AppError(
                "targetUserId is required",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        return conversationService.createDirectConversation(
            userId,
            targetUserId,
        );
    }

    async _createMessage({
        conversationId,
        userId,
        content,
        parentMessageId,
        attachments = [],
    }) {
        return prisma.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: {
                    conversationId,
                    userId,
                    content,
                    role: "user",
                    parentMessageId: parentMessageId ?? null,
                    attachments: {
                        create: attachments,
                    },
                },
                include: { attachments: true },
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessageId: message.id,
                    lastMessageAt: message.createdAt,
                    updatedAt: message.createdAt,
                },
            });

            return serializeBigInt(message);
        });
    }

    async getMessage(userId, conversationId, cursor, limit) {
        await this._userInConversation(conversationId, userId);

        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
                ...(cursor && {
                    id: {
                        lt: BigInt(cursor),
                    },
                }),
            },
            include: {
                parentMessage: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                attachments: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                replies: {
                    where: { deletedAt: null },
                    include: {
                        attachments: true,
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
            orderBy: {
                id: "desc",
            },
            take: limit,
        });
        return messages.reverse().map(serializeBigInt);
    }

    async createBotMessage(conversationId, userId, content, role) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                type: "BOT",
                deletedAt: null,
            },
        });
        if (!conversation) {
            throw new AppError("CONVERSATION_NOT_FOUND");
        }
        const message = await prisma.message.create({
            data: {
                conversationId,
                userId,
                content,
                role,
            },
        });
        return serializeBigInt(message);
    }
}

export default new MessageService();
