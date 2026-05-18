import authService from "#services/auth.service.js";
import jwtconfig from "#config/jwt.js";
import jwt from "jsonwebtoken";
import { HTTP_STATUS } from "#config/constants.js";
import AppError from "#utils/AppError.js";
import { extractAccessToken } from "#utils/extractAccessToken.js";
import {
    changePasswordSchema,
    forgotPasswordByPhoneSchema,
    forgotPasswordSchema,
    loginSchema,
    refreshTokenSchema,
    registerSchema,
    resetPasswordSchema,
    validateEmailSchema,
    validatePhoneSchema,
} from "#schemas/auth.schema.js";
import admin from "#config/firebase-admin.js";

class AuthController {
    async register(req, res) {
        console.log(req.body);

        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        console.log(result);

        const { name, email, password, phonenumber } = result.data;

        const { user, token } = await authService.register(
            name,
            email,
            password,
            phonenumber,
        );

        return res.success({ user, token }, 201);
    }
    async login(req, res) {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { email, password } = result.data;

        const { user, token } = await authService.login(email, password);

        return res.success({ user, token }, 200);
    }
    async logout(req, res) {
        const user = req.user;
        await authService.logout(user.id);
        return res.success("logout", 200);
    }
    async verifyEmail(req, res) {
        const emailToken = req.body?.token;

        if (!emailToken) {
            throw new AppError("Missing token", HTTP_STATUS.BAD_REQUEST);
        }
        if (typeof emailToken !== "string" || !emailToken.trim()) {
            throw new AppError("Invalid email token", HTTP_STATUS.BAD_REQUEST);
        }

        await authService.verifyEmail(emailToken);
        return res.success({ verified: true });
    }
    async resenVerifyEmail(req, res) {
        const user = req.user;
        if (!user) {
            throw new AppError("Invalid credentials", HTTP_STATUS.UNAUTHORIZED);
        }
        if (user.emailVerifiedAt) {
            throw new AppError(
                "Email already verified",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        await authService.resenVerifyEmail(user);

        return res.success("Verification email has been resent");
    }
    async getMe(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const access_token = extractAccessToken(req);
        const payload = jwt.verify(access_token, jwtconfig.secret);
        const user = await authService.getMe(payload.sub);
        if (!user) {
            throw new AppError("USER_NOT_FOUND", HTTP_STATUS.UNAUTHORIZED);
        }
        return res.success(user);
    }
    async refreshAccessToken(req, res) {
        const result = refreshTokenSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { refresh_token } = result.data;

        const accessToken = await authService.refreshAccessToken(refresh_token);

        return res.success(
            {
                access_token: accessToken.access_token,
                expires_in: accessToken.access_token_ttl,
            },
            HTTP_STATUS.OK,
        );
    }
    async changePassword(req, res) {
        const result = changePasswordSchema.safeParse(req.body);
        const user = req.user;

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { password, new_password, confirm_password } = result.data;

        await authService.changePassword(user, password, new_password);

        return res.success("PASSWORD_CHANGED");
    }
    async forgotPassword(req, res) {
        const result = forgotPasswordSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { email } = result.data;

        await authService.forgotPassword(email);

        return res.success(
            "Link đặt lại mật khẩu đã được gửi tới email cua bạn",
            200,
        );
    }
    async forgotPasswordByPhone(req, res) {
        const result = forgotPasswordByPhoneSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { phonenumber, firebase_token } = result.data;

        const decoded = await admin.auth().verifyIdToken(firebase_token);

        const normalizedInput = phonenumber.startsWith("0")
            ? "+84" + phonenumber.slice(1)
            : phonenumber;

        if (decoded.phonenumber !== normalizedInput) {
            throw new AppError(
                "Số điện thoại không khớp",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const resetToken = await authService.forgotPasswordByPhone(phonenumber);

        return res.success(
            "Link đặt lại mật khẩu đã được gửi tới số điện thoại của bạn",
            200,
        );
    }
    async resetPassword(req, res) {
        const result = resetPasswordSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const token = req.query.token; // lấy riêng từ query
        if (!token) {
            throw new AppError(
                "Invalid or missing token",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { password, new_password } = result.data;

        await authService.resetPassword(token, password, new_password);

        return res.success("Đổi mật khẩu thành công", 200);
    }
    async validateEmail(req, res) {
        const result = validateEmailSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "Invalid input",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { email } = result.data;

        const user = await authService.findUserByEmail(email);

        if (user) throw new AppError("Email already exists", 400);
        return res.success({
            available: !user,
        });
    }
    async validatePhone(req, res) {
        const result = validatePhoneSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "Invalid input",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { phonenumber } = result.data;

        const user = await authService.findUserByPhoneNumber(phonenumber);

        if (user) throw new AppError("Phone number already exists", 400);
        return res.success({
            available: !user,
        });
    }
}

export default new AuthController();
