import { z } from "zod";
import { HTTP_STATUS } from "#config/constants.js";
import AppError from "#utils/AppError.js";

const idSchema = z
    .string()
    .regex(/^\d+$/)
    .transform((val) => BigInt(val));

function parseParamId(req, _, next) {
    const result = idSchema.safeParse(req.params.id);

    if (!result.success) {
        throw new AppError("Invalid id", HTTP_STATUS.BAD_REQUEST);
    }

    req.targetUserId = result.data;
    next();
}

export default parseParamId;
