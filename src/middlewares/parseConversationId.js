import AppError from "#utils/AppError.js";

function parseConversationId(req, res, next) {
    const rawConversationId = req.params.conversationId;
    if (!rawConversationId || !/^\d+$/.test(rawConversationId)) {
        throw new AppError("INVALID_CONVERSATION_ID");
    }
    req.conversationId = BigInt(rawConversationId);
    next();
}

export default parseConversationId;
