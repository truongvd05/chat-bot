import express from "express";
import messageController from "#controllers/message.controller.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import authMeRequired from "#middlewares/authRequired.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import parseMessageId from "#middlewares/parseMessageId.js";
import AppError from "#utils/AppError.js";
import upload from "#middlewares/upload.js";

const router = express.Router();

router.use(authMeRequired);

router.post(
    "/conversations/:conversationId",
    rateLimitServce.shortMessage(),
    rateLimitServce.burstMessage(),
    rateLimitServce.longMessage(),
    parseConversationId,
    upload.array("files", 5),
    asyneHandle(messageController.sendMessage),
);

router.get(
    "/conversations/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(messageController.getMessages),
);

router.put(
    "/:messageId/conversations/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseMessageId,
    parseConversationId,
    asyneHandle(messageController.editMessage),
);

router.delete(
    "/:messageId/conversations/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseMessageId,
    parseConversationId,
    asyneHandle(messageController.deleteMessage),
);

export default router;
