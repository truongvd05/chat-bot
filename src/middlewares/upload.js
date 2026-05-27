import multer from "multer";
import AppError from "#utils/AppError.js";
import { HTTP_STATUS } from "#config/constants.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
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

export default upload;
