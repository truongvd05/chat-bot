import express from "express";
import authController from "#controllers/auth.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import { limitRefreshAccessToken } from "#middlewares/limitRefreshAccessToken.js";
import asyneHandle from "#middlewares/asyneHandle.js";

const router = express.Router();

// mọi router đếu có asyneHandle để xứ lí try catch

router.post(
    "/refresh",
    limitRefreshAccessToken,
    asyneHandle(authController.refreshAccessToken),
);
router.post(
    "/register",
    rateLimitServce.login(),
    asyneHandle(authController.register),
);
router.post(
    "/login",
    rateLimitServce.login(),
    asyneHandle(authController.login),
);
router.post(
    "/forgot-password",
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(authController.forgotPassword),
);
router.post(
    "/reset-password",
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(authController.resetPassword),
);

router.post(
    "/logout",
    authMeRequired,
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(authController.logout),
);
router.post(
    "/change-password",
    authMeRequired,
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(authController.changePassword),
);
router.post(
    "/verify-email",
    rateLimitServce.verifyEmailPerMinute(),
    rateLimitServce.verifyEmailPreDay(),
    asyneHandle(authController.verifyEmail),
);
router.post(
    "/resen-verify-email",
    rateLimitServce.senVerifyEmailPerMinute(),
    rateLimitServce.senVerifyEmailPerDay(),
    authMeRequired,
    asyneHandle(authController.resenVerifyEmail),
);
router.post(
    "/validate/email",
    rateLimitServce.validateEmailPerMinute(),
    rateLimitServce.validateEmailPerHour(),
    rateLimitServce.validateEmailPerDay(),
    asyneHandle(authController.validateEmail),
);
router.get("/me", authController.getMe);

export default router;
