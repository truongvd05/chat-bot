import { HTTP_STATUS } from "#config/constants.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import AppError from "#utils/AppError.js";
import jwt from "jsonwebtoken";
import jwtconfig from "#config/jwt.js";
import redis from "#config/redis.js";
import {
    createGroupConversationSchema,
    membersSchema,
    renameConversationSchema,
    searchSchema,
} from "#schemas/conversation.schema.js";

class ConversationController {
    async getConversations(req, res) {
        const user = req.user;
        const conversations = await conversationService.getConversations(
            user.id,
        );
        return res.success(conversations, HTTP_STATUS.OK);
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
        const result = createGroupConversationSchema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { name: title, members: memberIds } = result.data;
        const user = req.user;

        const conversation = await conversationService.createGroupConversation(
            user.id,
            title,
            memberIds,
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

        await res.setCache(conversation);

        return res.success(conversation, HTTP_STATUS.OK);
    }
    async renameConversation(req, res) {
        const result = renameConversationSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { title } = result.data;
        const user = req.user;
        const conversationId = req.conversationId;

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

    async searchConversation(req, res) {
        const result = searchSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { q } = result.data;
        const user = req.user;

        const search = await conversationService.searchConversation(user.id, q);

        return res.success(search, HTTP_STATUS.OK);
    }
    async addParticipant(req, res) {
        const result = membersSchema.safeParse(req.body);
        const io = req.app.get("io");

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { members: memberIds } = result.data;
        const user = req.user;
        const conversationId = req.conversationId;

        const addMembers = await conversationService.addParticipant(
            user.id,
            conversationId,
            memberIds,
            io,
        );

        await redis.del(`conv:${conversationId}`);

        return res.success(addMembers, HTTP_STATUS.CREATED);
    }
    async removeParticipant(req, res) {
        const result = membersSchema.safeParse(req.body);
        const io = req.app.get("io");

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { members: memberIds } = result.data;
        const user = req.user;
        const conversationId = req.conversationId;

        const removeMembers = await conversationService.removeParticipant(
            user.id,
            conversationId,
            memberIds,
            io,
        );

        await redis.del(`conv:${conversationId}`);

        return res.success(removeMembers, HTTP_STATUS.OK);
    }

    async listParticipants(req, res) {}
    async searchAvailableUsers(req, res) {
        const result = searchSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { q } = result.data;
        const user = req.user;
        const conversationId = req.conversationId;

        if (!q.trim()) throw new AppError("Invalid or missing querry");
        const search = await conversationService.searchAvailableUsers(
            user.id,
            conversationId,
            q,
        );
        return res.success(search, HTTP_STATUS.CREATED);
    }
    async promoteToAdmin(req, res) {
        const result = membersSchema.safeParse(req.body);
        const io = req.app.get("io");

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { members: memberIds } = result.data;
        const conversationId = req.conversationId;
        const user = req.user;

        const promote = await conversationService.promoteToAdmin(
            user.id,
            conversationId,
            memberIds,
            io,
        );

        await redis.del(`conv:${conversationId}`);

        return res.success(promote, HTTP_STATUS.CREATED);
    }
    async leaveGroup(req, res) {
        const user = req.user;
        const conversationId = req.conversationId;
        const io = req.app.get("io");

        const result = await conversationService.leaveGroup(
            user.id,
            conversationId,
            io,
        );

        await redis.del(`conv:${conversationId}`);

        return res.success(result, HTTP_STATUS.OK);
    }
}

export default new ConversationController();
