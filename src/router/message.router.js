import express from "express";
import messageController from "#controllers/message.controller.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import authMeRequired from "#middlewares/authRequired.js";

const router = express.Router();

router.post(
    "/conversations/:conversationId/messages",
    authMeRequired,
    rateLimitServce.message(),
    messageController.sendDirectMessage,
);

router.get(
    "/conversations/:conversationId/messages",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    messageController.getMessages,
);

router.put(
    "/:messageId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    messageController.editMessage,
);

router.delete(
    "/:messageId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    messageController.deleteMessage,
);

export default router;
