import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import parseTargetId from "#middlewares/parseTargerId.js";

const router = express.Router();

router.post(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    parseTargetId,
    asyneHandle(conversationController.addParticipant),
);

router.delete(
    "/:conversationId/:userId",
    authMeRequired,
    parseConversationId,
    parseTargetId,
    asyneHandle(conversationController.removeParticipant),
);

router.get(
    "/:conversationId",
    authMeRequired,
    asyneHandle(conversationController.listParticipants),
);

export default router;
