import { HTTP_STATUS } from "#config/constants.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import AppError from "#utils/AppError.js";
import jwt from "jsonwebtoken";
import jwtconfig from "#config/jwt.js";
import { addClient, emit } from "#SSE/sseManager.js";

class ConversationController {
    async createBotConversation(req, res) {
        const { title } = req.body;
        if (!title.trim())
            throw new AppError("Invalid title", HTTP_STATUS.BAD_REQUEST);
        const user = req.user;
        const newConversation = await conversationService.createBotConversation(
            user,
            title,
        );
        return res.success(newConversation, HTTP_STATUS.CREATED);
    }
    async getConversations(req, res) {
        const user = req.user;
        const conversations = await conversationService.getConversations(
            user.id,
        );
        return res.success(conversations, HTTP_STATUS.OK);
    }
    async getMyBotConversations(req, res) {
        const user = req.user;

        const conversations =
            await conversationService.getMyBotConversations(user);
        return res.success(conversations, HTTP_STATUS.OK);
    }
    async getMyBotConversation(req, res) {
        const user = req.user;

        const conversationId = req.conversationId;

        const botConversation = await conversationService.getMyBotConversation(
            user.id,
            conversationId,
        );
        return res.success(botConversation, HTTP_STATUS.OK);
    }

    async createDirectConversation(req, res) {
        const user = req.user;

        const targetUserId = req.targetUserId;

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

        const conversationId = req.conversationId;

        const conversation = await conversationService.getConversation(
            user.id,
            conversationId,
        );

        return res.success(conversation, HTTP_STATUS.OK);
    }
    async renameConversation(req, res) {
        const title = req.body?.title?.trim();
        const user = req.user;

        const conversationId = req.conversationId;

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
        return res.success(newConversation, HTTP_STATUS.OK);
    }
    async deleteConversation(req, res) {
        const user = req.user;

        const conversationId = req.conversationId;

        await conversationService.deleteConversation(user.id, conversationId);
        return res.success(null, 204);
    }

    async stream(req, res) {
        const token = req.query.token;
        if (!token) throw new AppError("no token", HTTP_STATUS.BAD_REQUEST);
        const payload = jwt.verify(token, jwtconfig.secret);
        const user = payload;
        const conversationId = req.conversationId;

        await messageService.verifyAccess(conversationId, user.id);
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        addClient(conversationId, res);
        emit(conversationId, { test: "connected ok" });
        res.write(`event: connected\ndata: "ok"\n\n`);
    }
    async searchConversation(req, res) {
        const user = req.user;
        const { q } = req.query;
        if (!q) throw new AppError("INVALID_OR_MISSING_QERRY");

        const result = await conversationService.searchConversation(user.id, q);
        return res.success(result, HTTP_STATUS.OK);
    }
    async addParticipant(req, res) {
        const user = req.user;

        const conversationId = req.conversationId;
        const targetUserId = req.targetUserId;

        const result = await conversationService.addParticipant(
            user.id,
            conversationId,
            targetUserId,
        );
        return res.success(result, HTTP_STATUS.CREATED);
    }
    async removeParticipant(req, res) {
        const user = req.user;
        const conversationId = req.id;
        const targetUserId = req.targetUserId;

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
