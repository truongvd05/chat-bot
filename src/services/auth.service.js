import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";
import bcrypt from "bcrypt";
import { pid } from "process";

class AuthService {
    async register(email, password) {
        try {
            const existed = await prisma.user.findUnique({
                where: { email },
            });
            if (existed) {
                throw new Error("EMAIL_ALREADY_EXISTS");
            }
            const hashPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashPassword,
                },
            });
            return serializeBigInt(user);
        } catch (err) {
            if (err.code === "P2002") {
                throw new Error("EMAIL_ALREADY_EXISTS");
            }
            throw err;
        }
    }
    async findUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        return user;
    }
    async findUserByEmail(email) {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
            },
        });
        return user;
    }
    async createRefreshToken(userId, refresh_token, refresh_token_ttl) {
        await prisma.refreshToken.create({
            data: {
                token: refresh_token,
                tokenExpiresAt: refresh_token_ttl,
                userId: BigInt(userId),
            },
        });
    }
    async verifyEmail(id) {
        const user = await prisma.user.updateMany({
            where: {
                id,
                emailVerifiedAt: null,
            },
            data: {
                emailVerifiedAt: new Date(),
            },
        });
        return user;
    }
    async revokedRefreshToken(refresh_token, token) {
        const result = await prisma.refreshToken.updateMany({
            where: {
                id: token.id,
                token: refresh_token,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
        if (result.count === 0) {
            return null;
        }
    }
    async findTokenRevoked(refresh_token, userId) {
        const token = await prisma.refreshToken.findFirst({
            where: { token: refresh_token, userId, isRevoked: false },
        });
        return token;
    }
    async findRefreshTokenNotRevokedOrExpired(refresh_token) {
        const result = await prisma.refreshToken.findFirst({
            where: {
                token: refresh_token,
                isRevoked: false,
                tokenExpiresAt: {
                    gt: new Date(),
                },
            },
        });
        return result;
    }
    async updatePassword(userId, hashedPassword) {
        const result = await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });
        return result;
    }
    async revokeAllRefreshTokens(userId) {
        const result = await prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
        return result;
    }
    async createPasswordResetToken(userId, tokenHash, time) {
        const result = await prisma.passwordResetToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt: time,
            },
        });
        return result;
    }
    async findValidPasswordResetToken(tokenHash) {
        const result = await prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        return result;
    }
    async markPasswordResetTokenUsed(tokenId) {
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
