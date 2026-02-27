import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import parseTargetId from "#middlewares/parseTargerId.js";

const router = express.Router();

router.post(
    "/direct",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseTargetId,
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
    "/bot/:conversationId",
    authMeRequired,
    parseConversationId,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.getMyBotConversation),
);

router.get(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.getConversation),
);

router.put(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.renameConversation),
);

router.delete(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.deleteConversation),
);
router.get(
    "/search",
    authMeRequired,
    asyneHandle(conversationController.searchConversation),
);
router.get(
    "/:conversationId/stream",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.stream),
);

export default router;
