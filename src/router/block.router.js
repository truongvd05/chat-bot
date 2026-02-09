import express from "express";
import blockController from "#controllers/block.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";

const router = express.Router();

router.get(
    "/",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    blockController.getAllBlock,
);

export default router;
