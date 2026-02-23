import { HTTP_STATUS } from "#config/constants.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import AppError from "#utils/AppError.js";

class ConversationController {
    async createBotConversation(req, res) {
        const user = req.user;
        const newConversation =
            await conversationService.createBotConversation(user);
        return res.success(newConversation, HTTP_STATUS.CREATED);
    }
    async getConversations(req, res) {
        const user = req.user;
        const conversations = await conversationService.getConversations(
            user.id,
        );
        return res.success(conversations);
    }
    async getMyBotConversations(req, res) {
        const user = req.user;

        const conversations =
            await conversationService.getMyBotConversations(user);
        return res.success(conversations);
    }
    async getMyBotConversation(req, res) {
        const user = req.user;

        const rawId = req.body.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID");
        }
        const conversationId = BigInt(rawId);
        const botConversation = await conversationService.getMyBotConversation(
            user.id,
            conversationId,
        );
        return res.success(botConversation);
    }

    async createDirectConversation(req, res) {
        const user = req.user;

        const rawId = req.body.targetUserId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            throw new AppError("INVALID_USER_ID", HTTP_STATUS.BAD_REQUEST);
        }
        const targetUserId = BigInt(rawId);

        const conversation = await conversationService.createDirectConversation(
            user.id,
            targetUserId,
        );
        return res.success(conversation, HTTP_STATUS.CREATED);
    }
    async createGroupConversation(req, res) {
        const user = req.user;
        const name = req.body.name;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            throw new AppError("INVALID_name", HTTP_STATUS.BAD_REQUEST);
        }
        if (name.length > 255) {
            throw new AppError("TITLE_TOO_LONG", HTTP_STATUS.BAD_REQUEST);
        }
        const conversation = await conversationService.createGroupConversation(
            user.id,
            name,
        );
        return res.success(conversation, HTTP_STATUS.CREATED);
    }
    async getConversation(req, res) {
        const user = req.user;

        const rawId = req.params.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawId);

        const conversation = await conversationService.getConversation(
            user.id,
            conversationId,
        );

        return res.success(conversation);
    }
    async renameConversation(req, res) {
        const title = req.body?.title?.trim();
        const user = req.user;

        const rawId = req.params.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            throw new AppError("INVALID_USER_ID", HTTP_STATUS.BAD_REQUEST);
        }
        const conversationId = BigInt(rawId);

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            throw new AppError("INVALID_TITLE", HTTP_STATUS.BAD_REQUEST);
        }
        if (title.length > 255) {
            throw new AppError("TITLE_TOO_LONG", HTTP_STATUS.BAD_REQUEST);
        }

        const newConversation = await conversationService.renameConversation(
            user.id,
            conversationId,
            title,
        );
        return res.success(newConversation);
    }
    async deleteConversation(req, res) {
        const user = req.user;

        const rawId = req.params.conversationId;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawId);

        await conversationService.deleteConversation(user.id, conversationId);
        return res.success("ok", 204);
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
        const result = await conversationService.addParticipant(
            user.id,
            conversationId,
            targetUserId,
        );
        return res.success(result, HTTP_STATUS.CREATED);
    }
    async removeParticipant(req, res) {
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
        const result = await conversationService.removeParticipant(
            user.id,
            conversationId,
            targetUserId,
        );
        return res.success(result, HTTP_STATUS.CREATED);
    }
    async listParticipants(req, res) {}
}

export default new ConversationController();
