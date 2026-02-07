import conversationService from "#services/conversation.service.js";

class ConversationController {
    async create(req, res) {
        const user = req.user;

        if (!user) return res.unauthorized();

        try {
            const newConversation = await conversationService.create(user);
            return res.success(newConversation);
        } catch (err) {
            console.error(err);
            return res.error("Failed to create conversation", 500);
        }
    }
    async rename(req, res) {
        const id = Number(req.body.id);
        const title = req.body?.title?.trim();
        const user = req.user;

        if (!user) return res.unauthorized();
        if (!Number.isInteger(id) || id <= 0) {
            return res.error("invalid or missing id");
        }
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return res.error("INVALID_TITLE", 400);
        }
        if (title.length > 255) {
            throw new Error("TITLE_TOO_LONG");
        }

        try {
            const newConversation = await conversationService.rename(
                user,
                id,
                title,
            );
            return res.success(newConversation);
        } catch (err) {
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            return res.error(err);
        }
    }
    async getAll(req, res) {
        const user = req.user;

        if (!user) return res.unauthorized();

        try {
            const conversations = await conversationService.getAll(user);
            return res.success(conversations);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async getOne(req, res) {
        const conversationId = Number(req.params.conversationId);
        const user = req.user;

        if (!user) return res.unauthorized();
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("Invalid or missing conversation Id ");
        }

        try {
            const conversation = await conversationService.getOne(
                user,
                conversationId,
            );
            return res.success(conversation);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            return res.error(err);
        }
    }
    async del(req, res) {
        const conversationId = Number(req.params.conversationId);
        const user = req.user;

        if (!user) return res.unauthorized();
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("Invalid or missing conversation Id ");
        }

        try {
            await conversationService.del(user, conversationId);
            return res.success("success", 200);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            return res.error(err);
        }
    }
    async getMessage(req, res) {
        const user = req.user;
        const conversationId = Number(req.params.conversationId);
        if (!user) return res.unauthorized();

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("Invalid or missing conversation id");
        }

        const limit = Math.min(Number(req.query.limit) || 5, 50);
        const offset = Math.max(Number(req.query.offset) || 0, 0);

        try {
            const messages = await conversationService.getMessage(
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
    async createMessage(req, res) {
        const user = req.user;
        const message = req.body.message;
        const conversationId = Number(req.params.conversationId);
        if (!user) return res.unauthorized();
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("invalid or missing id");
        }
        if (typeof message !== "string" || !message.trim()) {
            return res.error("invalid or misssing message");
        }
        try {
            const userMessage = await conversationService.create(
                conversationId,
                user,
                message,
                "user",
            );
            chatBotService
                .reply(conversationId, message)
                .then((botMessage) => {
                    emit(conversationId, botMessage);
                })
                .catch((err) => console.error(err));
            return res.success(userMessage, 200);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error("Conversation not found", 404);
            }
            if (err.message === "UNAUTHORIZED") {
                return res.unauthorized();
            }
            return res.error("Failed to create message");
        }
    }
    async editMessage(req, res) {
        const user = req.user;
        const message = req.body.message;
        const conversationId = Number(req.params.conversationId);
        const messageId = Number(req.body.message_id);
        if (!user) return res.unauthorized();
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("invalid or missing conversation id");
        }
        if (!Number.isInteger(messageId) || messageId <= 0) {
            return res.error("invalid or missing message id");
        }
        if (typeof message !== "string" || !message.trim()) {
            return res.error("invalid or misssing message");
        }
        try {
            await conversationService.edit(
                conversationId,
                user,
                messageId,
                message,
            );
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
        const conversationId = Number(req.params.conversationId);
        const messageId = Number(req.body.messageI_id);
        if (!user) return res.unauthorized();
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("invalid or missing conversation id");
        }
        if (!Number.isInteger(messageId) || messageId <= 0) {
            return res.error("invalid or missing message id");
        }
        try {
            await conversationService.del(user, messageId, conversationId);
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
    async stream(req, res) {
        const conversationId = Number(req.params.id);
        const user = req.user;
        if (!user) return res.unauthorized();
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.error("Invalid or missing conversation id");
        }
        try {
            await conversationService.verifyAccess(conversationId, user.id);
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
}

export default new ConversationController();
