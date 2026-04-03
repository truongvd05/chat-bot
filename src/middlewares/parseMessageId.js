import { z } from "zod";
import AppError from "#utils/AppError.js";

const messageIdSchema = z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val));

function parseMessageId(req, res, next) {
    const result = messageIdSchema.safeParse(req.params.messageId);

    if (!result.success) {
        throw new AppError("INVALID_MESSAGE_ID", 400);
    }

    req.messageId = result.data;
    next();
}

export default parseMessageId;
