import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import parseTargetId from "#middlewares/parseTargerId.js";

const router = express.Router();

router.use(authMeRequired);

router.post(
    "/:conversationId",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(conversationController.addParticipant),
);

router.delete(
    "/:conversationId/",
    parseConversationId,
    asyneHandle(conversationController.removeParticipant),
);

router.get(
    "/:conversationId",
    asyneHandle(conversationController.listParticipants),
);

export default router;
