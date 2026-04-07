import { HTTP_STATUS } from "#config/constants.js";
import {
    getMessagesSchema,
    sendMessageSchema,
} from "#schemas/message.schema.js";
import messageService from "#services/message.service.js";
import { serializeBigInt } from "#utils/serialize.js";

class MessageController {
    async sendMessage(req, res) {
        const result = sendMessageSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.errors[0].message,
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { content } = result.data;
        const targetUserId = req.targetUserId;
        const conversationId = req.conversationId || null;
        const user = req.user;
        const files = req.files ?? [];

        const send = await messageService.sendMessage(
            conversationId,
            user,
            content,
            files,
            targetUserId,
        );
        return res.success(send, HTTP_STATUS.CREATED);
    }
    async sendBotMessage(req, res) {
        const result = sendMessageSchema.safeParse(req.body);
        if (!result.success) {
            throw new AppError(
                result.error.errors[0].message,
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { content } = result.data;

        const user = req.user;
        const conversationId = req.conversationId;

        const send = await messageService.sendBotMessage(
            user.id,
            conversationId,
            content,
        );
        return res.success(send, HTTP_STATUS.CREATED);
    }
    async getMessages(req, res) {
        const result = getMessagesSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.errors[0].message,
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { c: cursor, limit } = result.data;
        const user = req.user;
        const conversationId = req.conversationId;

        const messages = await messageService.getMessage(
            user.id,
            conversationId,
            cursor,
            limit,
        );
        return res.success(messages, HTTP_STATUS.OK);
    }
    async editMessage(req, res) {
        const result = sendMessageSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.errors[0].message,
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { content } = result.data;
        const user = req.user;
        const messageId = req.messageId;

        const edit = await messageService.editMessage(
            user.id,
            messageId,
            content,
        );
        return res.success(edit, HTTP_STATUS.CREATED);
    }
    async deleteMessage(req, res) {
        const user = req.user;
        const messageId = req.messageId;

        await messageService.deleteMessage(user.id, messageId);
        return res.success(null, 204);
    }
    async unreadCount(userId, conversationId) {
        const count = await prisma.message.count({
            where: {
                conversationId,
                createdAt: {
                    gt: participant.lastReadAt,
                },
                senderId: {
                    not: userId,
                },
            },
        });
        return serializeBigInt(count);
    }
}

export default new MessageController();
