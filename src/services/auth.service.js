import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";
import bcrypt from "bcrypt";
import responseTokenService from "./responseToken.service.js";
import jwt from "jsonwebtoken";
import jwtconfig from "../config/jwt.js";
import jwtService from "./jwtService.js";
import queueService from "./queue.service.js";
import crypto from "crypto";

class AuthService {
    async findUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                createdAt: true,
            },
        });
    }
    async _revokeAllRefreshTokens(userId) {
        const result = await prisma.refreshToken.delete({
            where: {
                userId,
            },
        });
        return result;
    }
    async _createPasswordResetToken(userId, tokenHash, time) {
        await prisma.passwordResetToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: time,
            },
        });
    }
    async _findValidPasswordResetToken(tokenHash) {
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!resetToken) {
            throw new AppError(
                "Link đã hết hạn hoặc không hợp lệ",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        return resetToken;
    }
    async _updateUserRefreshToken(userId, newRefreshToken, tokenExpiresAt) {
        await prisma.refreshToken.upsert({
            where: { userId },
            update: {
                token: newRefreshToken,
                tokenExpiresAt,
            },
            create: {
                userId,
                token: newRefreshToken,
                tokenExpiresAt,
            },
        });
    }
    async _existedUser(email) {
        const existed = await prisma.user.findUnique({
            where: { email },
        });
        if (existed) {
            throw new AppError("email already exists", HTTP_STATUS.CONFLICT);
        }
    }
    async _markPasswordResetTokenUsed(tokenId) {
        const result = await prisma.passwordResetToken.updateMany({
            where: {
                id: tokenId,
                usedAt: null,
            },
            data: {
                usedAt: new Date(),
            },
        });
        return result;
    }
    async register(name, email, password) {
        await this._existedUser(email);
        const hashPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashPassword,
            },
        });
        const token = responseTokenService.loginAndRegister(user.id);
        const emailtoken = jwtService(
            user.id,
            jwtconfig.emailSecret,
            jwtconfig.emailTokenTTL,
        );
        queueService.push("sendVerifyEmail", {
            email: user.email,
            token: emailtoken,
        });

        await this._updateUserRefreshToken(
            user.id,
            token.refresh_token,
            token.refresh_token_ttl,
        );

        return { user: serializeBigInt(user), token };
    }
    async findUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        return user;
    }
    async login(email, password) {
        const user = await this.findUserByEmail(email);
        if (!user)
            throw new AppError(
                "sai tài khoản hoặc mật khẩu",
                HTTP_STATUS.UNAUTHORIZED,
            );
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            throw new AppError(
                "sai tài khoản hoặc mật khẩu",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }

        const token = responseTokenService.loginAndRegister(user.id);

        await this._updateUserRefreshToken(
            user.id,
            token.refresh_token,
            token.refresh_token_ttl,
        );
        const { password: _, ...saveUser } = user;

        return { user: serializeBigInt(saveUser), token };
    }
    async forgotPassword(email) {
        const user = await this.findUserByEmail(email);
        // luôn trả về true nếu không có user vì bảo mật
        if (!user) return;
        const passwordResetToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(
            Date.now() + jwtconfig.PasswordSecrectTTL * 1000,
        );
        const tokenHash = crypto
            .createHash("sha256")
            .update(passwordResetToken)
            .digest("hex");

        // xóa token cũ trước khi tạo token mới
        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({
                where: { userId: user.id },
            }),
            prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt,
                },
            }),
        ]);
        queueService.push("sendPasswordResetToken", {
            email: user.email,
            token: passwordResetToken,
        });
    }
    async logout(userId) {
        return prisma.refreshToken.update({
            where: { userId },
            data: { token: null },
        });
    }
    async _updatePassword(userId, hashedPassword) {
        const result = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });
        return result;
    }
    async refreshAccessToken(refresh_token) {
        const refreshToken = await prisma.refreshToken.findUnique({
            where: { token: refresh_token },
        });

        if (!refreshToken)
            throw new AppError("missing refreshToken", HTTP_STATUS.BAD_REQUEST);

        if (refreshToken.tokenExpiresAt < new Date()) {
            throw new AppError("refreshToken expired", HTTP_STATUS.BAD_REQUEST);
        }

        const user = await prisma.user.findUnique({
            where: { id: refreshToken.userId },
        });

        if (!user) {
            throw new AppError(
                "user not own refreshToken",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const accessToken = responseTokenService.refreshAccessToken(
            refreshToken.userId,
        );
        return accessToken;
    }
    async resetPassword(token, password, newPassword) {
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const resetToken = await this._findValidPasswordResetToken(tokenHash);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this._updatePassword(resetToken.userId, hashedPassword);
        await this._markPasswordResetTokenUsed(resetToken.id);
        await this._revokeAllRefreshTokens(resetToken.userId);
    }
    async changePassword(user, password, newPassword) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError(
                "Mật khẩu hiện tại không đúng",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this._updatePassword(user.id, hashedPassword);
        await this._revokeAllRefreshTokens(user.id);
        queueService.push("sendChangePasswordEmail", {
            email: user.email,
        });
    }
    async verifyEmail(emailToken) {
        const payload = jwt.verify(emailToken, jwtconfig.emailSecret);
        if (!payload?.sub) {
            throw new AppError(
                "Invalid token payload",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const user = await this.findUserById(payload.sub);
        if (!user) {
            throw new AppError("Invalid token user", HTTP_STATUS.BAD_REQUEST);
        }
        if (user.emailVerifiedAt) return;
        return await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                emailVerifiedAt: new Date(),
            },
        });
    }

    async resenVerifyEmail(user) {
        const emailtoken = jwtService(
            user.id,
            jwtconfig.emailSecret,
            jwtconfig.emailTokenTTL,
        );
        queueService.push("sendVerifyEmail", {
            email: user.email,
            token: emailtoken,
        });
        return;
    }
    async getMe(userId) {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
    }

    async deleteExpiredPassword() {
        const result = await prisma.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { usedAt: { not: null } },
                    { expiresAt: { lt: new Date() } },
                ],
            },
        });
        return result;
    }
}

export default new AuthService();
