import AppError from "#utils/AppError.js";

function parseTargetId(req, res, next) {
    const rawTargetId = req.body.targetUserId;
    if (!rawTargetId || !/^\d+$/.test(rawTargetId)) {
        throw new AppError("INVALID_USER_ID", HTTP_STATUS.BAD_REQUEST);
    }
    req.targetUserId = BigInt(rawTargetId);
    next();
}

export default parseTargetId;
