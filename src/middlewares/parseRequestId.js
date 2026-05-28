import { z } from "zod";
import { HTTP_STATUS } from "#config/constants.js";
import AppError from "#utils/AppError.js";

const targetUserIdSchema = z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val));

function parseRequestId(req, _, next) {
    const result = targetUserIdSchema.safeParse(req.body.requestId);

    if (!result.success) {
        throw new AppError("Invalid requestId id", HTTP_STATUS.BAD_REQUEST);
    }

    req.requestId = result.data;
    next();
}

export default parseRequestId;
