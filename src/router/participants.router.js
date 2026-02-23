import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import rateLimitServce from "#services/rateLimit.servce.js";

const router = express.Router();

router.post(
    "/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(conversationController.addParticipant),
);

router.delete(
    "/:conversationId/:userId",
    authMeRequired,
    asyneHandle(conversationController.removeParticipant),
);

router.get(
    "/:conversationId",
    authMeRequired,
    asyneHandle(conversationController.listParticipants),
);

export default router;
