import botMessagesControllers from "#controllers/botMessages.controllers.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import express from "express";

const router = express.Router();

router.post(
    "/conversations/:conversationId/messages",
    authMeRequired,
    rateLimitServce.botMessage(),
    botMessagesControllers.sendBotMessage,
);

export default router;
