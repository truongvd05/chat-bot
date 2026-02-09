import messageService from "#services/message.service.js";
function isValidPositiveBigInt(value) {
    return typeof value === "bigint" && value > 0n;
}
class MessageController {
    async sendDirectMessage(req, res) {
        const targetUserId = BigInt(req.body.targetUserId);
        const conversationId = BigInt(req.params.conversationId) || null;
        const content = req.body.content?.trim();
        const user = req.user;

        if (!user) return res.unauthorized();
        if (
            !content ||
            typeof content !== "string" ||
            content.trim().length === 0
        ) {
            return res.error("Message content is required", 400);
        }
        if (!conversationId && !targetUserId) {
            return res.error(
                "Either conversationId or targetUserId is required",
                400,
            );
        }
        if (targetUserId && !isValidPositiveBigInt(targetUserId)) {
            return res.error("Invalid targetUser id", 400);
        }

        if (conversationId && !isValidPositiveBigInt(conversationId)) {
            return res.error("Invalid conversation id", 400);
        }
        try {
            const result = await messageService.sendDirectMessage(
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

    async getMessages(req, res) {
        const user = req.user;
        const conversationId = Number(req.params.conversationId);
        if (!user) return res.unauthorized();

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("Invalid or missing conversation id");
        }

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
        const messageId = BigInt(req.params.messageId);
        if (!user) return res.unauthorized();
        if (messageId && !isValidPositiveBigInt(messageId)) {
            return res.error("Invalid conversation id", 400);
        }
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
        const messageId = BigInt(req.params.messageId);
        if (!user) return res.unauthorized();
        if (messageId && !isValidPositiveBigInt(messageId)) {
            return res.error("Invalid conversation id", 400);
        }
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
