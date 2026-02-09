import express from "express";
import conversationController from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";

const router = express.Router();

router.post(
    "/:conversationId/participants",
    authMeRequired,
    conversationController.addParticipant,
);

router.delete(
    "/:conversationId/participants/:userId",
    authMeRequired,
    conversationController.removeParticipant,
);

router.get(
    "/:conversationId/participants",
    authMeRequired,
    conversationController.listParticipants,
);

export default router;
