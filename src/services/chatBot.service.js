import aiService from "./ai.service.js";
import messageService from "./message.service.js";

class ChatbotService {
    async reply(conversationId, message) {
        const history = await messageService.getForAi(conversationId);
        const output = await aiService.chat(
            "openai/gpt-5-nano",
            history,
            message,
        );
        await messageService.create(conversationId, null, output, "bot");
        return output;
    }
}

export default new ChatbotService();
