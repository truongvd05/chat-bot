import { gateway, generateText, streamText } from "ai";
import messageService from "./message.service.js";
import { emit } from "#SSE/sseManager.js";

class AiService {
    constructor() {}
    async chat(model, history, messages, conversationId, tools) {
        let fullAnswer = "";
        const historyText = history
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n");
        try {
            const result = streamText({
                model,
                prompt: `Bạn là một chatbot hỗ trợ người dùng.
                      Trả lời ngắn gọn, rõ ràng, đúng trọng tâm.
                      Nếu có code, hãy giải thích từng dòng.
                      đây là lịch sử cuộc hội thoại ${historyText}
                      đây là câu mới của user: ${messages}
                      :`,
                tools,
                onChunk(chunk) {
                    if (chunk.type === "text-delta") {
                        fullAnswer += chunk.text;
                    }
                },
                onFinish: async () => {
                    await messageService.createBotMessage(
                        conversationId,
                        null,
                        fullAnswer,
                        "bot",
                    );
                    emit(conversationId, {
                        type: "bot_done",
                    });
                },
            });
        } catch (err) {
            console.log(err);
            throw new Error("cannot connected");
        }
    }
    async webSearch(model, history, messages, prompt) {
        const historyText = history
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n");

        const result = await streamText({
            model,
            prompt: `
                Bạn là một chatbot hỗ trợ người dùng.
                Trả lời ngắn gọn, rõ ràng, đúng trọng tâm.
                Nếu có code, hãy giải thích từng dòng.
                chỉ trả về text thôi nhé!
                đây là lịch sử cuộc hội thoại ${historyText}
                đây là câu mới của user: ${messages}
                :`,
            tools: {
                perplexity_search: gateway.tools.perplexitySearch({
                    country: "VN",
                    searchRecencyFilter: ["vi"],
                }),
            },
        });

        for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
                process.stdout.write(part.text);
            } else if (part.type === "tool-call") {
                console.log("Tool call:", part.toolName);
            } else if (part.type === "tool-result") {
                console.log("Search results received");
            }
        }
        console.log(result);

        return result;
    }
}

export default new AiService();
