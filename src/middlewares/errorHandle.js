import jwt from "jsonwebtoken";
import { ERROR_MESSAGE, HTTP_STATUS, PRISMA_CODE } from "#config/constants.js";
import isProduction from "#utils/isProduction.js";

const errorHandle = (err, _, res, next) => {
    let status = HTTP_STATUS.GONE;
    let errorMessage = err.message || String(err);
    if (err?.code === PRISMA_CODE.DUPLICATE) {
        return res.error({ message: "duplicate entry" }, HTTP_STATUS.CONFLICT);
    }
    if (err instanceof jwt.TokenExpiredError) {
        return res.error(
            {
                message:
                    ERROR_MESSAGE.TOKEN_EXPIRED || "Verify link has expired",
            },
            HTTP_STATUS.GONE,
        );
    }
    if (err instanceof jwt.JsonWebTokenError) {
        errorMessage = ERROR_MESSAGE.UNAUTHORIZED;
    }
    if (err.isOperational) {
        return res.error({ message: err.message }, err.statusCode);
    }
    if (isProduction()) {
        return res.error("Server error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return res.status(status).json({
        success: false,
        errorMessage,
    });
};

export default errorHandle;
