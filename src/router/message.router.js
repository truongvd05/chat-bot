import express from "express";
import messageController from "#controllers/message.controller.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import authMeRequired from "#middlewares/authRequired.js";
import asyneHandle from "#middlewares/asyneHandle.js";

const router = express.Router();

router.post(
    "/conversations/:conversationId",
    authMeRequired,
    rateLimitServce.shortMessage(),
    rateLimitServce.burstMessage(),
    rateLimitServce.longMessage(),
    asyneHandle(messageController.sendMessage),
);

router.post(
    "/bot/conversations/:conversationId",
    authMeRequired,
    rateLimitServce.shortMessage(),
    rateLimitServce.burstMessage(),
    rateLimitServce.longMessage(),
    asyneHandle(messageController.sendBotMessage),
);

router.get(
    "/conversations/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(messageController.getMessages),
);

router.put(
    "/:messageId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(messageController.editMessage),
);

router.delete(
    "/:messageId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(messageController.deleteMessage),
);

export default router;
