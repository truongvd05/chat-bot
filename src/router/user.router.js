import express from "express";
import userController from "#controllers/user.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";

const router = express.Router();

router.post(
    "/:id/block",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    userController.blockUser,
);
router.delete(
    "/:id/block",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    userController.unblockUser,
);

export default router;
