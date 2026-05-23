import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import parseTargetId from "#middlewares/parseTargerId.js";
import { cacheMiddleware } from "#middlewares/cacheMiddleware.js";

const router = express.Router();

// mọi router cần authMeRequired
router.use(authMeRequired);

router.post(
    "/direct",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseTargetId,
    asyneHandle(conversationController.createDirectConversation),
);
router.post(
    "/group",
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.createGroupConversation),
);

router.get(
    "/",
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.getConversations),
);

router.get("/search", asyneHandle(conversationController.searchConversation));

router.get(
    "/groups",
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(conversationController.getGroupConversation),
);

router.get(
    "/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    cacheMiddleware((req) => `conv:${req.conversationId}`),
    asyneHandle(conversationController.getConversation),
);

router.put(
    "/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.renameConversation),
);

router.delete(
    "/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.deleteConversation),
);

router.get(
    "/:conversationId/available-users",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.searchAvailableUsers),
);

router.post(
    "/:conversationId/promoteToAdmin",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.promoteToAdmin),
);

router.post(
    "/:conversationId/leaveGroup",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.leaveGroup),
);

export default router;
