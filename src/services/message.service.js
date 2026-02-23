import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";
import chatBotService from "./chatBot.service.js";

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
            throw new AppError("CANNOT_MESSAGE_SELF");
        }
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });
        if (!targetUser) {
            throw new AppError("TARGET_USER_NOT_FOUND");
        }
        const isBlock = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: targetUserId, blockedId: user.id },
                    { blockerId: user.id, blockedId: targetUserId },
                ],
            },
        });
        if (isBlock) throw new AppError("USER_BLOCKED");
        if (role === "user") {
            await this._userInConversation(conversationId, user.id);
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: true,
            },
        });
        if (!conversation) {
            throw new AppError("CONVERSATION_NOT_FOUND");
        }
        if (conversation.type !== "DIRECT") {
            throw new AppError("INVALID_DIRECT_CONVERSATION");
        }

        const newMessage = await prisma.message.create({
            data: {
                userId: role === "user" ? user.id : null,
                conversationId,
                content,
                role,
            },
        });
        return serializeBigInt(newMessage);
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
