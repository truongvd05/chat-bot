import aiService from "./ai.service.js";
import messageService from "./message.service.js";

class ChatbotService {
    async reply(conversationId) {
        const history = await messageService.getForAi(conversationId);
        return await aiService.chat(
            "openai/gpt-5-nano",
            history,
            history[history.length - 1].content,
            conversationId,
            null,
        );
    }
}

export default new ChatbotService();
