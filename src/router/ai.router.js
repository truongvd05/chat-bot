import aiController from "#controllers/ai.controller.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import authMeRequired from "#middlewares/authRequired.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import express from "express";

const router = express.Router();

router.use(authMeRequired);

router.post(
    "/suggest/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    parseConversationId,
    asyneHandle(aiController.suggest),
);

export default router;
