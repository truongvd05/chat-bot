import express from "express";
import authController from "#controllers/auth.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";

const router = express.Router();

// mọi router đếu có asyneHandle để xứ lí try catch

router.post(
    "/refresh",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.refreshAccessToken),
);

router.post(
    "/register",
    rateLimitServce.login(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.register),
);

router.post(
    "/login",
    rateLimitServce.login(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.login),
);
router.post(
    "/forgot-password",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.forgotPassword),
);
router.post(
    "/forgot-password-phone",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.forgotPasswordByPhone),
);
router.post(
    "/reset-password",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.resetPassword),
);

router.post(
    "/logout",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.logout),
);
router.post(
    "/change-password",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
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
router.post(
    "/validate/phone",
    rateLimitServce.validateEmailPerMinute(),
    rateLimitServce.validateEmailPerHour(),
    rateLimitServce.validateEmailPerDay(),
    asyneHandle(authController.validatePhone),
);
router.get("/me", asyneHandle(authController.getMe));

export default router;
