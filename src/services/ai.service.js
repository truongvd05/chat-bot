import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import AppError from "#utils/AppError.js";
import messageService from "./message.service.js";

const agent = createOpenAI({
    apiKey: process.env.AI_OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const myPrompt = `
                Bạn là chatbot hỗ trợ người dùng trả lời tin nhắn. luôn trả lời bằng tiếng việt
                
                Nhiệm vụ: Đọc tin nhắn đầu vào và trả về ĐÚNG một JSON array gồm 3 string,
                KHÔNG có text nào khác ngoài array.

                Quy tắc tạo 3 gợi ý:
                - [0]: Đồng ý / phản hồi tích cực (kèm câu hỏi tiếp theo nếu phù hợp)
                - [1]: Từ chsuggestionsối / phản hồi tiêu cực lịch sự
                - [2]: Hỏi thêm thông tin liên quan

                Ví dụ input: "trưa nay đi ăn cơm không?"
                Ví dụ output: ["Ok, ăn ở quán nào?", "Thôi mình không đi được rồi", "Mấy giờ thì đi vậy?"]

                Nếu không phải câu hỏi (ví dụ: bày tỏ cảm xúc, thông báo), hãy gợi ý 3 phản hồi phù hợp với ngữ cảnh
`;

class AiService {
    #buildPrompt(history, lastMessage) {
        const historyText = [...history]
            .reverse()
            .map((m) => `${m.user?.name ?? "User"}: ${m.content}`)
            .join("\n");

        return `${myPrompt}
            Lịch sử hội thoại:
            ${historyText}

            Tin nhắn cuối cần trả lời: ${lastMessage}`;
    }

    #parseJson(text) {
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (!Array.isArray(parsed)) throw new Error("Not an array");
        return parsed;
    }
    async suggest(lastMessage, conversationId, userId, io) {
        try {
            io.to(`user_${userId}`).emit("bot_thinking", {
                conversationId,
                thinking: true,
            });
            const suggestions = await this.getSuggestions(lastMessage);
            io.to(`user_${userId}`).emit("bot_suggest", {
                conversationId,
                suggestions,
            });
            console.log(suggestions);
        } catch (err) {
            if (err?.statusCode === 429) {
                console.warn("AI rate limit exceeded, skipping suggest");
                return; // im lặng, không throw lỗi
            }
            console.log(err);
        } finally {
            io.to(`user_${userId}`).emit("bot_thinking", {
                conversationId,
                thinking: false,
            });
        }
    }
    async getSuggestions(lastMessage, conversationId) {
        const history = await messageService.getRecentMessages(
            conversationId,
            10,
        );

        const { text } = await generateText({
            model: agent(process.env.AI_MODEL),
            prompt: this.#buildPrompt(history, lastMessage),
        });
        return this.#parseJson(text);
    }
}

export default new AiService();
