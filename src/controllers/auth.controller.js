import authService from "#services/auth.service.js";
import { serializeBigInt } from "#utils/serialize.js";
import bcrypt from "bcrypt";
import jwtconfig from "#config/jwt.js";
import jwtService from "#services/jwtService.js";
import jwt from "jsonwebtoken";
import responseTokenService from "#services/responseToken.service.js";
import validateChangePassword from "#utils/validateChangePassword.js";
import crypto from "crypto";
import queueService from "#services/queue.service.js";
import { HTTP_STATUS } from "#config/constants.js";

class AuthController {
    async register(req, res) {
        const { email, password } = req.body;
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return res.error("Email is required and must be valid");
        }
        if (
            !password ||
            typeof password !== "string" ||
            password.trim().length < 6
        ) {
            return res.error("Password must be at least 6 characters");
        }
        try {
            const user = await authService.register(email, password);
            const token = responseTokenService.loginAndRegister(user);
            const emailtoken = jwtService(
                user.id,
                jwtconfig.emailSecret,
                jwtconfig.emailTokenTTL,
            );
            queueService.push("sendVerifyEmail", {
                email: user.email,
                token: emailtoken,
            });
            await authService.updateUserRefreshToken(
                user.id,
                token.refresh_token,
                token.refresh_token_ttl,
            );
            return res.success(user, 201, token);
        } catch (err) {
            console.log(err);
            if (err.message === "EMAIL_ALREADY_EXISTS") {
                return res.error("Email đã tồn tại", HTTP_STATUS.CONFLICT);
            }
            return res.error(err);
        }
    }
    async login(req, res) {
        const { email, password } = req.body;
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return res.error("Email is required and must be valid");
        }
        if (
            !password ||
            typeof password !== "string" ||
            password.trim().length < 6
        ) {
            return res.error("Password must be at least 6 characters");
        }
        try {
            const user = await authService.findUserByEmail(email);
            if (!user) {
                return res.unauthorized();
            }
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.unauthorized("Email hoặc password không đúng");
            }
            const token = responseTokenService.loginAndRegister(user.id);
            await authService.updateUserRefreshToken(
                user.id,
                token.refresh_token,
                token.refresh_token_ttl,
            );
            const { password: _, ...saveUser } = user;
            return res.success(serializeBigInt(saveUser), 200, token);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async logout(req, res) {
        const user = req.user;
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.success(null, 204);
        }
        try {
            const token = await authService.findTokenRevoked(
                refresh_token,
                user.id,
            );
            if (!token) {
                return res.success(null, 204);
            }
            await authService.revokedRefreshToken(refresh_token, token);
            return res.success("logout", 200);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async verifyEmail(req, res) {
        const emailToken = req.body?.token;
        if (!emailToken) {
            return res.error("missing token");
        }
        if (typeof emailToken !== "string" || !emailToken.trim()) {
            return res.error("Invalid token");
        }
        try {
            const payload = jwt.verify(emailToken, jwtconfig.emailSecret);
            if (!payload?.sub) {
                return res.error("Invalid token payload");
            }
            const user = await authService.findUserById(payload.sub);
            if (!user) return res.unauthorized();
            if (user.emailVerifiedAt) {
                return res.success({ verified: true });
            }
            await authService.verifyEmail(user.id);
            return res.success({ verified: true });
        } catch (err) {
            return res.error(err.message || "Verify email failed", 429);
        }
    }
    async resenVerifyEmail(req, res) {
        const user = req.user;
        try {
            if (!user) {
                return res.unauthorized();
            }
            if (user.verified_at) {
                return res.error("Email already verified");
            }
            const emailtoken = jwtService(
                user.id,
                jwtconfig.emailSecret,
                jwtconfig.emailTokenTTL,
            );
            queueService.push("sendVerifyEmail", {
                email: user.email,
                token: emailtoken,
            });
            return res.success("Verification email has been resent");
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
    async getMe(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;
        const access_token = extractAccessToken(req);
        try {
            const payload = jwt.verify(access_token, jwtconfig.secret);
            const user = await authService.getMe(payload.sub);
            if (!user) {
                return res.error("USER_NOT_FOUND");
            }
            return res.success(user);
        } catch (err) {
            console.log(err);

            return res.error("INVALID_ACCESS_TOKEN");
        }
    }
    async refreshAccessToken(req, res) {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.error("MISSING_REFRESH_TOKEN");
        }
        try {
            const payload = jwt.verify(refresh_token, jwtconfig.refresh_token);
            const refreshToken = await authService.getRefreshTokenByUser(
                payload.userId,
            );

            if (!refreshToken || refreshToken.token !== refresh_token) {
                return res.error(
                    "INVALID_REFRESH_TOKEN",
                    HTTP_STATUS.UNAUTHORIZED,
                );
            }
            if (refreshToken.tokenExpiresAt <= new Date()) {
                return res.error(
                    "REFRESH_TOKEN_EXPIRED",
                    HTTP_STATUS.UNAUTHORIZED,
                );
            }

            const accessToken = responseTokenService.refreshAccessToken(
                payload.userId,
            );
            return res.success({
                access_token: accessToken.access_token,
                expires_in: accessToken.access_token_ttl,
            });
        } catch (err) {
            console.log(err);
            return res.error("server err", 500);
        }
    }
    async changePassword(req, res) {
        const password = req.body.password;
        const newPassword = req.body.new_password;
        const confirmPassword = req.body.confirm_password;
        const user = req.user;
        if (!user) return res.unauthorized();
        try {
            validateChangePassword({ password, newPassword, confirmPassword });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.error(
                    "Mật khẩu hiện tại không đúng",
                    HTTP_STATUS.UNAUTHORIZED,
                );
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await authService.updatePassword(user.id, hashedPassword);
            await authService.revokeAllRefreshTokens(user.id);
            queueService.push("sendChangePasswordEmail", {
                email: user.email,
            });
            return res.success("PASSWORD_CHANGED");
        } catch (err) {
            console.log(err);
            return res.error(err.message || "Đổi mật khẩu thất bại");
        }
    }
    async forgotPassword(req, res) {
        const email = req.body.email;
        if (!email || typeof email !== "string" || email.trim().length === 0) {
            return res.error("Invalid or misssing email");
        }
        try {
            const user = await authService.findUserByEmail(email);
            if (!user) return res.error("Email không tồn tại", 401);
            const passwordResetToken = crypto.randomBytes(64).toString("hex");
            const expiresAt = new Date(
                Date.now() + jwtconfig.PasswordSecrectTTL * 1000,
            );
            const tokenHash = crypto
                .createHash("sha256")
                .update(passwordResetToken)
                .digest("hex");
            await authService.createPasswordResetToken(
                user.id,
                tokenHash,
                expiresAt,
            );
            queueService.push("sendPasswordResetToken", {
                email,
                token: passwordResetToken,
            });
            return res.success("Đổi mật khẩu thành công", 200);
        } catch (err) {
            console.log(err);
            return res.error(err, 500);
        }
    }
    async resetPassword(req, res) {
        const password = req.body.password;
        const newPassword = req.body.new_password;
        const token = req.query.token;
        if (!password || password.trim().length === 0) {
            return res.error(
                "Missing password fields",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        if (newPassword.trim().length < 6) {
            return res.error(
                "Mật khẩu phải ít nhất 6 ký tự",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        if (password !== newPassword) {
            return res.error(
                "Mật khẩu Không giống nhau",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        if (!token) {
            return res.error(
                "Invalit or missing token",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        try {
            const tokenHash = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

            const resetToken =
                await authService.findValidPasswordResetToken(tokenHash);
            if (!resetToken) {
                return res.error("Link đã hết hạn hoặc không hợp lệ");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await authService.updatePassword(resetToken.userId, hashedPassword);
            await authService.markPasswordResetTokenUsed(resetToken.id);
            await authService.revokeAllRefreshTokens(resetToken.userId);
            return res.success("Đổi mật khẩu thành công", 200);
        } catch (err) {
            console.log(err);
            return res.error(err, 429);
        }
    }
}

export default new AuthController();
