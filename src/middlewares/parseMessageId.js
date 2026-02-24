import AppError from "#utils/AppError.js";

function parseMessageId(req, res, next) {
    const rawMessageId = req.params.messageId;
    if (!rawMessageId || !/^\d+$/.test(rawMessageId)) {
        throw new AppError("INVALID_MESSAGE_ID", 400);
    }
    req.messageId = BigInt(rawMessageId);
    next();
}

export default parseMessageId;
