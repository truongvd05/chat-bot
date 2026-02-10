import aiService from "./ai.service.js";
import messageService from "./message.service.js";

class ChatbotService {
    async reply(conversationId, message) {
        const history = await messageService.getForAi(conversationId);
        return await aiService.chat(
            "openai/gpt-5-nano",
            history,
            message,
            conversationId,
        );
    }
}

export default new ChatbotService();
