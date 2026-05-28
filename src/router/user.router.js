import express from "express";
import userController from "#controllers/user.controller.js";
import authMeRequired from "#middlewares/authRequired.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import parseTargetId from "#middlewares/parseTargerId.js";
import upload from "#middlewares/upload.js";
import parseRequestId from "#middlewares/parseRequestId.js";

const router = express.Router();

// tất cả router càn authMeRequired
router.use(authMeRequired);

router.get(
    "/friends",
    rateLimitServce.defaultAuthRateLimit(),
    asyneHandle(userController.getFriend),
);

router.put(
    "/",
    rateLimitServce.defaultEditUserPerMinuteRateLimit(),
    rateLimitServce.defaultEditUserPerDayRateLimit(),
    asyneHandle(userController.editUser),
);

router.patch(
    "/avatar",
    rateLimitServce.defaultAuthRateLimit(),
    upload.single("avatar"),
    asyneHandle(userController.updateAvatar),
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
    parseRequestId,
    asyneHandle(userController.acceptFriend),
);

router.post(
    "/reject-friend",
    rateLimitServce.defaultAuthRateLimit(),
    parseRequestId,
    asyneHandle(userController.rejectFriend),
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

router.get("/me", asyneHandle(userController.getMe));

router.get("/search", asyneHandle(userController.searchUsers));

export default router;
