import adminController from "#controllers/admin.controller.js";
import authController from "#controllers/auth.controller.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import authMeRequired from "#middlewares/authRequired.js";
import isAdmin from "#middlewares/isAdmin.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import express from "express";

const router = express.Router();

// PUBLIC
router.post(
    "/login",
    rateLimitServce.login(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.login),
);

router.post(
    "/refresh",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.refreshAccessToken),
);

router.use(authMeRequired);
router.use(isAdmin);

// PRIVATE
router.post(
    "/logout",
    rateLimitServce.defaultPerMinuteRateLimit(),
    rateLimitServce.defaultPerDayRateLimit(),
    asyneHandle(authController.logout),
);

router.get(
    "/users",
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.getUsers),
);

router.get(
    "/groups",
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.getGroups),
);

router.patch(
    `/users/:id`,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.editUser),
);

router.patch(
    `/users/:id/ban`,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.banUser),
);

router.patch(
    `/groups/:id`,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.statusGroup),
);

router.patch(
    `/users/:id/unban`,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.unbanUser),
);

router.delete(
    `/groups/:id`,
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.deleteGroup),
);

router.get(
    "/stats/today",
    rateLimitServce.defaultPerMinuteRateLimit(),
    asyneHandle(adminController.getTodayStats),
);

export default router;
