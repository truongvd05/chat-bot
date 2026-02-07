import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";

class ConversationService {
    async _userInConversation(conversationId, userId) {
        const exists = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
                deletedAt: null,
            },
            select: { id: true },
        });
        if (!exists) throw new Error("CONVERSATION_NOT_FOUND");
        return true;
    }
    async create(user) {
        const conversation = await prisma.conversation.create({
            data: {
                userId: user.id,
                title: "New Conversation",
            },
        });
        return serializeBigInt(conversation);
    }
    async rename(user, conversationId, title) {
        await this._userInConversation(conversationId, user.id);
        const result = await prisma.conversation.update({
            where: {
                id: conversationId,
            },
            data: { title },
        });
        return serializeBigInt(result);
    }
    async getAll(user) {
        const result = await prisma.conversation.findMany({
            where: {
                userId: user.id,
                deletedAt: null,
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        return result.map(serializeBigInt);
    }
    async getOne(user, conversationId) {
        const result = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId: user.id,
                deletedAt: null,
            },
        });
        if (!result) {
            throw new Error("CONVERSATION_NOT_FOUND");
        }
        return serializeBigInt(result);
    }
    async del(user, conversationId) {
        await this._userInConversation(conversationId, user.id);
        const deleted = await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                deletedAt: new Date(),
            },
        });
        return serializeBigInt(deleted);
    }
    async getMessage(user, conversationId, limit, offset) {
        await this._userInConversation(conversationId, user.id);
        const result = await prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            skip: offset,
        });
        return result.map(serializeBigInt);
    }
    async createMessage(conversationId, user, message, role = "user") {
        if (role === "user") {
            if (!user) throw new Error("UNAUTHORIZED");
            await this._userInConversation(conversationId, user.id);
        }
        const newMessage = await prisma.message.create({
            data: {
                userId: role === "user" ? user.id : null,
                conversationId,
                content: message,
                role,
            },
        });
        return serializeBigInt(newMessage);
    }
    async editMessage(conversationId, user, messageId, content) {
        await this._userInConversation(conversationId, user.id);
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                conversationId,
                role: "user",
                deletedAt: null,
            },
        });
        if (!message) {
            throw new Error("MESSAGE_NOT_FOUND");
        }
        const editMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                content,
            },
        });
        return serializeBigInt(editMessage);
    }
    async deleteMessage(user, messageId, conversationId) {
        await this._userInConversation(conversationId, user.id);
        const existed = await prisma.message.findFirst({
            where: {
                id: messageId,
                conversationId,
                role: "user",
                deletedAt: null,
            },
        });
        if (!existed) {
            throw new Error("MESSAGE_NOT_FOUND");
        }
        const message = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                deletedAt: new Date(),
            },
        });
        return serializeBigInt(message);
    }
}

export default new ConversationService();
