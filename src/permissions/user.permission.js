import { HTTP_STATUS } from "#config/constants.js";
import { findUserById } from "#repositories/user.repository.js";
import AppError from "#utils/AppError.js";

export async function requireVerifiedUser(userId) {
    const user = await findUserById(userId);
    if (!user) {
        throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }
    if (!user.emailVerifiedAt) {
        throw new AppError(
            "Tài khoản chưa được xác thực",
            HTTP_STATUS.FORBIDDEN,
        );
    }
    return user;
}
