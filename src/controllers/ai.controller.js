import { HTTP_STATUS } from "#config/constants.js";
import aiService from "#services/ai.service.js";

class AiController {
    async suggest(req, res) {
        const user = req.user;

        const { lastMessage } = req.body;
        if (!lastMessage?.trim()) {
            return res.success([], HTTP_STATUS.OK);
        }
        if (!user.aiSuggest) return res.success([], HTTP_STATUS.OK);

        const userId = req.user.id;
        const conversationId = req.conversationId;

        const suggestions = await aiService.getSuggestions(
            lastMessage,
            conversationId,
        );
        res.success(suggestions, HTTP_STATUS.CREATED);
    }
}

export default new AiController();
