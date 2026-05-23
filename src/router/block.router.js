import express from "express";
import blockController from "#controllers/block.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";

const router = express.Router();

router.use(authMeRequired);

router.get(
    "/",
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(blockController.getAllBlock),
);

export default router;
