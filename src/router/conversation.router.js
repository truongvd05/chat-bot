import express from "express";
import conversationControlle from "#controllers/conversation.controlle.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";

const router = express.Router();

router.post("/create", authMeRequired, conversationControlle.create);
router.post("/rename", authMeRequired, conversationControlle.rename);
router.get("/", authMeRequired, conversationControlle.getAll);
router.get("/:conversationId", authMeRequired, conversationControlle.getOne);
router.delete("/:conversationId", authMeRequired, conversationControlle.del);
router.get(
    "/:conversationId/messages",
    authMeRequired,
    conversationControlle.getMessage,
);
router.post(
    "/:conversationId/message",
    rateLimitServce.message(),
    authMeRequired,
    conversationControlle.createMessage,
);
router.put(
    "/:conversationId/message",
    authMeRequired,
    conversationControlle.editMessage,
);
router.delete(
    "/:conversationId/message",
    authMeRequired,
    conversationControlle.deleteMessage,
);
router.get(
    "/stream/:conversationId",
    authMeRequired,
    conversationControlle.stream,
);

export default router;
