import prisma from "#libs/prisma.js";

class MessageService {
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
}

export default new MessageService();
