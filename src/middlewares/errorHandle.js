import jwt from "jsonwebtoken";
import { ERROR_MESSAGE, HTTP_STATUS, PRISMA_CODE } from "#config/constants.js";

const errorHandle = (err, _, res, next) => {
    let status = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let errorMessage = err.message || String(err);
    if (err?.code) {
        switch (err.code) {
            case PRISMA_CODE.DUPLICATE:
                return res.error("Duplicate entry", HTTP_STATUS.CONFLICT);

            case PRISMA_CODE.NOT_FOUND:
                return res.error("Record not found", HTTP_STATUS.NOT_FOUND);

            case PRISMA_CODE.FOREIGN_KEY:
                return res.error(
                    "Invalid reference id",
                    HTTP_STATUS.BAD_REQUEST,
                );
            case PRISMA_CODE.VALUE_TOO_LONG:
                return res.error(
                    "Invalid reference id",
                    HTTP_STATUS.BAD_REQUEST,
                );
            case PRISMA_CODE.NULL_CONSTRAINT:
                return res.error(
                    "Invalid reference id",
                    HTTP_STATUS.BAD_REQUEST,
                );
            case PRISMA_CODE.INVALID_INPUT:
                return res.error(
                    "Invalid reference id",
                    HTTP_STATUS.BAD_REQUEST,
                );
            default:
                break;
        }
    }
    if (err instanceof jwt.TokenExpiredError) {
        return res.error(
            ERROR_MESSAGE.TOKEN_EXPIRED || "Verify link has expired",
            HTTP_STATUS.UNAUTHORIZED,
        );
    }
    if (err instanceof jwt.JsonWebTokenError) {
        return res.error(
            ERROR_MESSAGE.UNAUTHORIZED || "Invalid token",
            HTTP_STATUS.UNAUTHORIZED,
        );
    }
    if (err.isOperational) {
        return res.error(errorMessage, status);
    }
    return next(err);
};

export default errorHandle;
