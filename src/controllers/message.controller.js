import chatBotService from "#services/chatBot.service.js";
import messageService from "#services/message.service.js";

class MessageController {
    async sendMessage(req, res) {
        const rawTargetId = req.body.targetUserId;
        const rawConversationId = req.params.conversationId || null;
        const content = req.body.content?.trim();
        const user = req.user;

        if (!rawTargetId || !/^\d+$/.test(rawTargetId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const targetUserId = BigInt(rawTargetId);

        if (!rawConversationId || !/^\d+$/.test(rawConversationId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawConversationId);
        if (
            !content ||
            typeof content !== "string" ||
            content.trim().length === 0
        ) {
            return res.error("Message content is required", 400);
        }

        try {
            const result = await messageService.sendMessage(
                conversationId,
                user,
                content,
                targetUserId,
            );
            return res.success(result);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async sendBotMessage(req, res) {
        const user = req.user;
        const content = req.body.content?.trim();

        const rawConversationId = req.params.conversationI;
        if (!rawConversationId || !/^\d+$/.test(rawConversationId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        if (
            !content ||
            typeof content !== "string" ||
            content.trim().length === 0
        ) {
            return res.error("Message content is required", 400);
        }
        const conversationId = BigInt(rawConversationId);
        try {
            await messageService.sendBotMessage(
                user.id,
                conversationId,
                content,
            );
            chatBotService.reply(conversationId, content);
            return res.success(result);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async getMessages(req, res) {
        const user = req.user;
        const rawConversationId = req.params.conversationI;

        if (!rawConversationId || !/^\d+$/.test(rawConversationId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawConversationId);

        const limit = Math.min(Number(req.query.limit) || 5, 50);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        try {
            const messages = await messageService.getMessage(
                user,
                conversationId,
                limit,
                offset,
            );
            return res.success(messages);
        } catch (err) {
            console.error("Failed to get messages:", err);

            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }

            return res.error("Failed to retrieve messages");
        }
    }
    async editMessage(req, res) {
        const user = req.user;
        const content = req.body.content;
        const rawMessageId = req.params.messageId;
        if (!rawMessageId || !/^\d+$/.test(rawMessageId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const messageId = BigInt(rawMessageId);

        if (typeof content !== "string" || !content.trim()) {
            return res.error("invalid or missing message");
        }
        try {
            await messageService.editMessage(user.id, messageId, content);
            return res.success("ok", 200);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            if (err.message === "MESSAGE_NOT_FOUND") {
                return res.error("Message not found", 404);
            }
            return res.error("Failed to edit message");
        }
    }
    async deleteMessage(req, res) {
        const user = req.user;
        const rawMessageId = req.params.messageId;
        if (!rawMessageId || !/^\d+$/.test(rawMessageId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const messageId = BigInt(rawMessageId);
        try {
            await messageService.deleteMessage(user.id, messageId);
            return res.success("ok", 200);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            if (err.message === "MESSAGE_NOT_FOUND") {
                return res.error("Message not found", 404);
            }

            return res.error("Failed to delete message");
        }
    }
}

export default new MessageController();
