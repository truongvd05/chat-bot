import express from "express";
import userController from "#controllers/user.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";

const router = express.Router();

router.post(
    "/:id/block",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(userController.blockUser),
);
router.delete(
    "/:id/block",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(userController.unblockUser),
);

router.get("/search", authMeRequired, asyneHandle(userController.searchUsers));

export default router;
