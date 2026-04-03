import { z } from "zod";
import { HTTP_STATUS } from "#config/constants.js";
import AppError from "#utils/AppError.js";

const targetUserIdSchema = z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val));

function parseTargetId(req, _, next) {
    const result = targetUserIdSchema.safeParse(req.body.targetUserId);

    if (!result.success) {
        throw new AppError("Invalid user id", HTTP_STATUS.BAD_REQUEST);
    }

    req.targetUserId = result.data;
    next();
}

export default parseTargetId;
