import { HTTP_STATUS } from "#config/constants.js";
import chatBotService from "#services/chatBot.service.js";
import messageService from "#services/message.service.js";

class BotMessage {
    async sendBotMessage(req, res) {
        const message = req.body.message;
        const rawId = req.params.conversationId;

        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID", 400);
        }
        const conversationId = BigInt(rawId);

        if (typeof message !== "string" || !message.trim()) {
            return res.error("invalid or misssing message");
        }
        try {
            const userMessage = await messageService.sendBotMessage(
                user.id,
                conversationId,
                message,
            );
            chatBotService.reply(conversationId, message);

            return res.success(userMessage, 201);
        } catch (err) {
            console.log(err);
            if (err.message === "CONVERSATION_NOT_FOUND") {
                return res.error(
                    "Conversation not found",
                    HTTP_STATUS.NOT_FOUND,
                );
            }
            if (err.message === "UNAUTHORIZED") {
                return res.unauthorized();
            }
            return res.error("Failed to create message");
        }
    }
}

export default new BotMessage();
