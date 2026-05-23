import { HTTP_STATUS } from "#config/constants.js";
import {
    getMessagesSchema,
    sendMessageSchema,
} from "#schemas/message.schema.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";

class MessageController {
    async sendMessage(req, res) {
        const result = sendMessageSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { content } = result.data;
        const conversationId = req.conversationId || null;
        const user = req.user;
        const files = req.files ?? [];

        const message = await messageService.sendMessage(
            conversationId,
            user,
            content,
            files,
        );
        const io = req.app.get("io");

        const participants = await conversationService.finDparticipants(
            message.conversationId,
        );

        for (const p of participants) {
            io.to(`user_${p.userId}`).emit("receive_message", message);
        }

        return res.success(message, HTTP_STATUS.CREATED);
    }

    async getMessages(req, res) {
        const result = getMessagesSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { c: cursor, limit } = result.data;
        const user = req.user;
        const conversationId = req.conversationId;

        const messages = await messageService.getMessages(
            user.id,
            conversationId,
            cursor,
            limit,
        );

        return res.success(messages, HTTP_STATUS.OK);
    }
    async editMessage(req, res) {
        const result = sendMessageSchema.safeParse(req.body);
        const conversationId = req.conversationId;

        const io = req.app.get("io");

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { content } = result.data;
        const user = req.user;
        const messageId = req.messageId;

        const edit = await messageService.editMessage(
            user.id,
            messageId,
            conversationId,
            content,
            io,
        );
        return res.success(edit, HTTP_STATUS.CREATED);
    }
    async deleteMessage(req, res) {
        const user = req.user;
        const messageId = req.messageId;

        await messageService.deleteMessage(user.id, messageId);
        return res.success(null, HTTP_STATUS.NO_CONTENT);
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
