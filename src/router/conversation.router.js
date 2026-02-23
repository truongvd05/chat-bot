import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";

const router = express.Router();

router.post(
    "/direct",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.createDirectConversation),
);
router.post(
    "/group",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.createGroupConversation),
);

router.post(
    "/bot",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(conversationController.createBotConversation),
);

router.get(
    "/",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.getConversations),
);

router.get(
    "/bots",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.getMyBotConversations),
);
router.get(
    "/bots/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.getMyBotConversation),
);

router.get(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.getConversation),
);

router.put(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.renameConversation),
);

router.delete(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.deleteConversation),
);

router.get(
    "/:conversationId/stream",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    conversationController.stream,
);

export default router;
