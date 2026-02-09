import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";

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
            throw new Error("CONVERSATION_NOT_FOUND_OR_FORBIDDEN");
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
            throw new Error("MESSAGE_NOT_FOUND_OR_FORBIDDEN");
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
    async sendDirectMessage(
        conversationId,
        user,
        content,
        targetUserId,
        role = "user",
    ) {
        if (user.id === targetUserId) {
            throw new Error("CANNOT_MESSAGE_SELF");
        }
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });
        if (!targetUser) {
            throw new Error("TARGET_USER_NOT_FOUND");
        }
        const isBlock = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: targetUserId, blockedId: user.id },
                    { blockerId: user.id, blockedId: targetUserId },
                ],
            },
        });
        if (isBlock) throw new Error("USER_BLOCKED");
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
            throw new Error("CONVERSATION_NOT_FOUND");
        }
        if (conversation.type !== "DIRECT") {
            throw new Error("INVALID_DIRECT_CONVERSATION");
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
            throw new Error("CONVERSATION_PARTICIPANT_NOT_FOUND");
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
        return messages.reverse().map(serializeBigInt);
    }
}

export default new MessageService();
