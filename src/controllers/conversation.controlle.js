import { HTTP_STATUS } from "#config/constants.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";

class ConversationController {
    async createBotConversation(req, res) {
        const user = req.user;

        try {
            const newConversation =
                await conversationService.createBotConversation(user);
            return res.success(newConversation, HTTP_STATUS.CREATED);
        } catch (err) {
            console.error(err);
            return res.error("Failed to create conversation", 500);
        }
    }
    async getConversations(req, res) {
        const user = req.user;
        try {
            const conversations = await conversationService.getConversations(
                user.id,
            );
            return res.success(conversations);
        } catch (err) {
            console.error(err);
            return res.error("Failed to get conversation", 500);
        }
    }
    async getMyBotConversations(req, res) {
        const user = req.user;

        try {
            const conversations =
                await conversationService.getMyBotConversations(user);
            return res.success(conversations);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async getMyBotConversation(req, res) {
        const user = req.user;

        const rawId = req.body.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID");
        }
        const conversationId = BigInt(rawId);
        try {
            const botConversation =
                await conversationService.getMyBotConversation(
                    user.id,
                    conversationId,
                );
            return res.success(botConversation);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }

    async createDirectConversation(req, res) {
        const user = req.user;

        const rawId = req.body.targetUserId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID");
        }
        const targetUserId = BigInt(rawId);

        try {
            const existingConversation =
                await conversationService.findDirectConversation(
                    user.id,
                    targetUserId,
                );
            if (existingConversation) {
                return res.success(existingConversation);
            }
            const conversation =
                await conversationService.createDirectConversation(
                    user.id,
                    targetUserId,
                );
            return res.success(conversation, HTTP_STATUS.CREATED);
        } catch (err) {
            console.log(err);
            return res.error("Failed to create conversation");
        }
    }
    async getConversation(req, res) {
        const user = req.user;

        const rawId = req.params.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawId);

        try {
            const conversation = await conversationService.getConversation(
                user.id,
                conversationId,
            );
            if (!conversation) {
                return res.error(
                    "Conversation not found",
                    HTTP_STATUS.NOT_FOUND,
                );
            }
            return res.success(conversation);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error(
                    "Conversation not found",
                    HTTP_STATUS.NOT_FOUND,
                );
            }
            return res.error(err, 500);
        }
    }
    async renameConversation(req, res) {
        const title = req.body?.title?.trim();
        const user = req.user;

        const rawId = req.params.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID");
        }
        const conversationId = BigInt(rawId);

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return res.error("INVALID_TITLE");
        }
        if (title.length > 255) {
            return res.error("TITLE_TOO_LONG");
        }

        try {
            const newConversation =
                await conversationService.renameConversation(
                    user.id,
                    conversationId,
                    title,
                );
            return res.success(newConversation);
        } catch (err) {
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error(
                    "Conversation not found",
                    HTTP_STATUS.NOT_FOUND,
                );
            }
            return res.error(err);
        }
    }
    async deleteConversation(req, res) {
        const user = req.user;

        const rawId = req.params.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawId);

        try {
            await conversationService.deleteConversation(
                user.id,
                conversationId,
            );
            return res.success("ok", 204);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            return res.error(err);
        }
    }

    async stream(req, res) {
        const user = req.user;

        const rawId = req.params.id;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawId);
        try {
            await messageService.verifyAccess(conversationId, user.id);
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
            addClient(conversationId, res);
            res.write(`event: connected\ndata: "ok"\n\n`);
        } catch (err) {
            console.error(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            return res.error("Failed to establish stream connection");
        }
    }
    async addParticipant(req, res) {
        const user = req.user;

        const rawConversationId = req.params.id;
        const rawTargetId = req.body.user_id;

        if (!rawConversationId || !/^\d+$/.test(rawConversationId)) {
            return res.error("INVALID_USER_ID");
        }
        const conversationId = BigInt(rawId);

        if (!rawTargetId || !/^\d+$/.test(rawTargetId)) {
            return res.error("INVALID_USER_ID");
        }
        const targetUserId = BigInt(rawId);
        try {
            const result = await conversationService.addParticipant(
                user.id,
                conversationId,
                targetUserId,
            );
            return res.success(result, HTTP_STATUS.CREATED);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async removeParticipant(req, res) {}
    async listParticipants(req, res) {}
}

export default new ConversationController();
