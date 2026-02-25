import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";
import chatBotService from "./chatBot.service.js";
import conversationService from "./conversation.service.js";

class MessageService {
    // kiểm tra user có trong cuộc hội thoại hay không và cuộc hộc thoại đã bị xóa chưa
    async _userInConversation(conversationId, userId) {
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
            throw new AppError("CONVERSATION_NOT_FOUND_OR_FORBIDDEN");
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
    async sendMessage(
        conversationId,
        user,
        content,
        targetUserId,
        role = "user",
    ) {
        if (user.id === targetUserId) {
            throw new AppError(
                "cannot send message yourself",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });
        if (!targetUser) {
            throw new AppError("target user not found", HTTP_STATUS.NOT_FOUND);
        }
        const isBlock = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: targetUserId, blockedId: user.id },
                    { blockerId: user.id, blockedId: targetUserId },
                ],
            },
        });
        if (isBlock) throw new AppError("user block", HTTP_STATUS.BAD_REQUEST);

        // check có conversation chưa
        let conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: true,
            },
        });
        // chưa có thì tạo
        if (!conversation) {
            conversation = await conversationService.createDirectConversation(
                user.id,
                targetUserId,
            );
        }
        await this._userInConversation(conversation.id, user.id);
        await this._userInConversation(conversation.id, targetUserId);

        const payload = {
            conversation,
            userId: user.id,
            content,
            role,
        };
        switch (conversation.type) {
            case "DIRECT":
            case "GROUP": {
                const newMessage = await this.handleDirectMessage(payload);
                return serializeBigInt(newMessage);
            }
            case "BOT": {
                const newMessage = await this.handleBotMessage(payload);
                return serializeBigInt(newMessage);
            }
            default:
                throw new AppError("Invalid conversation type", 400);
        }
    }

    async handleDirectMessage({ conversation, userId, content }) {
        return this._createMessage({
            conversationId: conversation.id,
            userId,
            content,
            role: null,
        });
    }
    async handleBotMessage({ conversation, userId, content, role }) {
        return this._createMessage({
            conversationId: conversation.id,
            userId,
            content,
            role: role ?? "user",
        });
    }
    async _createMessage({ conversationId, userId, content, role }) {
        return prisma.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: {
                    userId: role === "user" ? userId : null,
                    conversationId,
                    content,
                    role,
                },
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessageId: message.id,
                    lastMessageAt: message.createdAt,
                    updatedAt: message.createdAt,
                },
            });

            return message;
        });
    }

    async getMessage(userId, conversationId, limit, offset) {
        await this._userInConversation(conversationId, userId);
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
        });
        if (!participant) {
            throw new AppError("CONVERSATION_PARTICIPANT_NOT_FOUND");
        }
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
                createdAt: {
                    gt: participant.deletedAt ?? new Date(0),
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            skip: offset,
        });
        sendMessage;
        return messages.reverse().map(serializeBigInt);
    }
    async sendBotMessage(userId, conversationId, content, role = "user") {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                ownerId: userId,
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
        chatBotService.reply(conversationId, content);

        return serializeBigInt(message);
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
