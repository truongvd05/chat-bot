import aiService from "./ai.service.js";
import messageService from "./message.service.js";

class ChatbotService {
    async reply(conversationId) {
        const history = await messageService.getForAi(conversationId);
        return await aiService.chat(
            "stepfun/step-3.5-flash:free",
            history,
            history[history.length - 1].content,
            conversationId,
            null,
        );
    }
}

export default new ChatbotService();
