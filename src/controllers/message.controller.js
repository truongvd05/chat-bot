import { HTTP_STATUS } from "#config/constants.js";
import messageService from "#services/message.service.js";

class MessageController {
    async sendMessage(req, res) {
        const targetUserId = req.targetUserId;
        const conversationId = req.conversationId || null;
        const content = req.body.content?.trim();
        const user = req.user;

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
        const conversationId = req.conversationId;

        if (
            !content ||
            typeof content !== "string" ||
            content.trim().length === 0
        ) {
            return res.error("Message content is required");
        }

        const result = await messageService.sendBotMessage(
            user.id,
            conversationId,
            content,
        );
        return res.success(result, HTTP_STATUS.CREATED);
    }
    async getMessages(req, res) {
        const user = req.user;
        const rawConversationId = req.conversationI;

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
        const messageId = req.messageId;

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
        const messageId = req.messageId;

        await messageService.deleteMessage(user.id, messageId);
        return res.success("ok", 204);
    }
}

export default new MessageController();
