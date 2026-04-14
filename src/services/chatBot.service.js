import aiService from "./ai.service.js";
import messageService from "./message.service.js";

class ChatbotService {
    async reply(conversationId) {
        console.log(process.env.AI_MODEL);

        const history = await messageService.getForAi(conversationId);
        return await aiService.chat(
            process.env.AI_MODEL,
            history,
            history[history.length - 1].content,
            conversationId,
            null,
        );
    }
}

export default new ChatbotService();
