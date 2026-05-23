import express from "express";
import userController from "#controllers/user.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import parseTargetId from "#middlewares/parseTargerId.js";

const router = express.Router();

// tất cả router càn authMeRequired
router.use(authMeRequired);

router.get(
    "/friends",
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(userController.getFriend),
);

router.post(
    "/add-friend",
    rateLimitServce.defaultAuthRateLimit(),
    parseTargetId,
    asyneHandle(userController.addFriend),
);

router.post(
    "/accept-friend",
    rateLimitServce.defaultAuthRateLimit(),
    parseTargetId,
    asyneHandle(userController.acceptFriend),
);

router.get(
    "/friend-request",
    rateLimitServce.defaultAuthRateLimit(),
    userController.getFriendRequest,
);

router.post(
    "/:id/block",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseTargetId,
    asyneHandle(userController.blockUser),
);
router.delete(
    "/:id/block",
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseTargetId,
    asyneHandle(userController.unblockUser),
);

router.get("/search", asyneHandle(userController.searchUsers));

export default router;
