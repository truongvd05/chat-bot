import authService from "#services/auth.service.js";
import jwtconfig from "#config/jwt.js";
import jwt from "jsonwebtoken";
import validateChangePassword from "#utils/validateChangePassword.js";
import { HTTP_STATUS } from "#config/constants.js";
import AppError from "#utils/AppError.js";
import validator from "validator";

class AuthController {
    async register(req, res) {
        const { name, email, password, confirm_password } = req.body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            throw new AppError(
                "Name is required and must be valid",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        if (name.trim().length < 2) {
            throw new AppError(
                "Name is must be at least 2 characters",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            throw new AppError(
                "Email is required and must be valid",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        if (
            !password ||
            typeof password !== "string" ||
            password.trim().length < 6
        ) {
            throw new AppError(
                "Password must be at least 6 characters",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        if (password !== confirm_password) {
            throw new AppError(
                "Password must be at least 6 characters",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { user, token } = await authService.register(
            name,
            email,
            password,
        );
        return res.success({ user, token }, 201);
    }
    async login(req, res) {
        console.log("login");

        const { email, password } = req.body;
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            throw new AppError(
                "Email is required and must be valid",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        if (
            !password ||
            typeof password !== "string" ||
            password.trim().length < 6
        ) {
            throw new AppError(
                "Password must be at least 6 characters",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
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
        if (user.verified_at) {
            throw new AppError(
                "Email already verified",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        await authService.resenVerifyEmail(user.id);

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
        const { refresh_token } = req.body;
        if (!refresh_token) {
            throw new AppError(
                "MISSING_REFRESH_TOKEN",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

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
        const password = req.body.password;
        const newPassword = req.body.new_password;
        const confirmPassword = req.body.confirm_password;
        const user = req.user;
        validateChangePassword({ password, newPassword, confirmPassword });

        await authService.changePassword(user, password, newPassword);

        return res.success("PASSWORD_CHANGED");
    }
    async forgotPassword(req, res) {
        const email = req.body.email;
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return res.error("Invalid or misssing email");
        }
        await authService.forgotPassword(email);

        return res.success(
            "Link đặt lại mật khẩu đã được gửi tới email cua bạn",
            200,
        );
    }
    async resetPassword(req, res) {
        const password = req.body.password;
        const newPassword = req.body.new_password;
        const token = req.query.token;
        if (!password || password.trim().length === 0) {
            throw new AppError(
                "Missing password fields",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        if (newPassword.trim().length < 6) {
            throw new AppError(
                "Mật khẩu phải ít nhất 6 ký tự",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        if (password !== newPassword) {
            throw new AppError("Mật khẩu Không khớp", HTTP_STATUS.UNAUTHORIZED);
        }
        if (!token) {
            throw new AppError(
                "Invalit or missing token",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        await authService.resetPassword(token, password, newPassword);

        return res.success("Đổi mật khẩu thành công", 200);
    }
    async validateEmail(req, res) {
        const { email } = req.body || null;
        if (!email) {
            throw new AppError("Email is required", 400);
        }
        if (!validator.isEmail(email)) {
            throw new AppError("Invalid email format", 400);
        }
        const user = await authService.findUserByEmail(email);
        if (user) throw new AppError("Email already exists", 400);
        return res.success({
            available: !user,
        });
    }
}

export default new AuthController();
