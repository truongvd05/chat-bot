import messageService from "#services/message.service.js";

class BotMessage {
    async sendBotMessage(req, res) {
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
            const userMessage = await messageService.createMessage(
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
}

export default new BotMessage();
