import { HTTP_STATUS } from "#config/constants.js";
import AppError from "#utils/AppError.js";

function parseTargetId(req, _, next) {
    const rawTargetId = req.body.targetUserId;
    if (!rawTargetId || !/^\d+$/.test(rawTargetId)) {
        throw new AppError("Invalid user id", HTTP_STATUS.BAD_REQUEST);
    }
    req.targetUserId = BigInt(rawTargetId);
    next();
}

export default parseTargetId;
