import AppError from "#utils/AppError.js";
import { z } from "zod";

const conversationIdSchema = z
    .string()
    .regex(/^\d+$/, "INVALID_CONVERSATION_ID");

function parseConversationId(req, res, next) {
    const result = conversationIdSchema.safeParse(req.params.conversationId);
    if (!result.success) {
        throw new AppError("INVALID_CONVERSATION_ID");
    }
    req.conversationId = BigInt(result.data);
    next();
}

export default parseConversationId;
