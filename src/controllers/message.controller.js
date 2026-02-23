import { HTTP_STATUS } from "#config/constants.js";
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
            return res.error("INVALID_USER_ID");
        }
        const conversationId = BigInt(rawConversationId);
        if (
            !content ||
            typeof content !== "string" ||
            content.trim().length === 0
        ) {
            return res.error("Message content is required");
        }

        const result = await messageService.sendMessage(
            conversationId,
            user,
            content,
            targetUserId,
        );
        return res.success(result, HTTP_STATUS.CREATED);
    }
    async sendBotMessage(req, res) {
        const user = req.user;
        const content = req.body.content?.trim();
        const rawConversationId = req.params.conversationId;

        if (!rawConversationId || !/^\d+$/.test(rawConversationId)) {
            return res.error("INVALID_CONVERSATION_ID");
        }
        if (
            !content ||
            typeof content !== "string" ||
            content.trim().length === 0
        ) {
            return res.error("Message content is required");
        }
        const conversationId = BigInt(rawConversationId);
        const result = await messageService.sendBotMessage(
            user.id,
            conversationId,
            content,
        );
        return res.success(result, HTTP_STATUS.CREATED);
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

        const messages = await messageService.getMessage(
            user,
            conversationId,
            limit,
            offset,
        );
        return res.success(messages);
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
        const result = await messageService.editMessage(
            user.id,
            messageId,
            content,
        );
        return res.success(result, 200);
    }
    async deleteMessage(req, res) {
        const user = req.user;
        const rawMessageId = req.params.messageId;
        if (!rawMessageId || !/^\d+$/.test(rawMessageId)) {
            return res.error("INVALID_USER_ID");
        }
        const messageId = BigInt(rawMessageId);
        await messageService.deleteMessage(user.id, messageId);
        return res.success("ok", 204);
    }
}

export default new MessageController();
