import express from "express";
import messageController from "#controllers/message.controller.js";
import rateLimitServce from "#services/rateLimit.servce.js";
import authMeRequired from "#middlewares/authRequired.js";
import asyneHandle from "#middlewares/asyneHandle.js";
import parseConversationId from "#middlewares/parseConversationId.js";
import parseTargetId from "#middlewares/parseTargerId.js";
import parseMessageId from "#middlewares/parseMessageId.js";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "video/mp4",
            "application/pdf",
        ];
        if (!allowed.includes(file.mimetype)) {
            return cb(
                new AppError("File type not allowed", HTTP_STATUS.BAD_REQUEST),
            );
        }
        cb(null, true);
    },
});

const router = express.Router();

router.post(
    "/conversations/:conversationId",
    authMeRequired,
    rateLimitServce.shortMessage(),
    rateLimitServce.burstMessage(),
    rateLimitServce.longMessage(),
    upload.array("files"),
    parseConversationId,
    parseTargetId,
    asyneHandle(messageController.sendMessage),
);

router.post(
    "/bot/conversations/:conversationId",
    authMeRequired,
    rateLimitServce.shortMessage(),
    rateLimitServce.burstMessage(),
    rateLimitServce.longMessage(),
    parseConversationId,
    asyneHandle(messageController.sendBotMessage),
);

router.get(
    "/conversations/:conversationId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseConversationId,
    asyneHandle(messageController.getMessages),
);

router.put(
    "/:messageId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseMessageId,
    asyneHandle(messageController.editMessage),
);

router.delete(
    "/:messageId",
    authMeRequired,
    rateLimitServce.defaultPerMinuteRateLimit(),
    parseMessageId,
    asyneHandle(messageController.deleteMessage),
);

export default router;
