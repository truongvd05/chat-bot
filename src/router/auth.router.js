import express from "express";
import authController from "#controllers/auth.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import { limitRefreshAccessToken } from "#middlewares/limitRefreshAccessToken.js";

const router = express.Router();

router.post("/refresh", limitRefreshAccessToken, authController.refreshAccessToken);
router.post("/register", rateLimitServce.login(), authController.register);
router.post("/login", rateLimitServce.login(), authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

router.post("/logout", authMeRequired, authController.logout);
router.post("/change-password", authMeRequired, authController.changePassword);
router.post(
  "/verify-email",
  rateLimitServce.verifyEmailPerMinute(),
  rateLimitServce.verifyEmailPreDay(),
  authController.verifyEmail,
);
router.post(
  "/resen-verify-email",
  rateLimitServce.senVerifyEmailPerMinute(),
  rateLimitServce.senVerifyEmailPerDay(),
  authMeRequired,
  authController.resenVerifyEmail,
);
router.get("/me", authMeRequired, authController.getMe);

export default router;
