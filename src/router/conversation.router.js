import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";

const router = express.Router();

router.post(
    "/direct",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.createDirectConversation,
);

router.post(
    "/bot",
    authMeRequired,
    conversationController.createBotConversation,
);

router.get(
    "/",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.getConversations,
);

router.get(
    "/bots",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.getMyBotConversations,
);
router.get(
    "/bots/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.getMyBotConversation,
);

router.get(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.getConversation,
);

router.put(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.renameConversation,
);

router.delete(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.deleteConversation,
);

router.get(
    "/:conversationId/stream",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.stream,
);

export default router;
