import { gateway, generateText, streamText } from "ai";

class AiService {
  constructor() {}
  async chat(model, history, messages, tools) {
    const historyText = history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
    const { text } = await generateText({
      model,
      prompt: `
                Bạn là một chatbot hỗ trợ người dùng.
                Trả lời ngắn gọn, rõ ràng, đúng trọng tâm.
                Nếu có code, hãy giải thích từng dòng.
                ${historyText}
                user: ${messages}
                assistant:`,
      tools,
    });
    return text.trim();
  }
  async webSearch(model, prompt) {
    const result = streamText({
      model,
      prompt,
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

    return result.toDataStreamResponse();
  }
}

export default new AiService();
