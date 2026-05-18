import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";

class UserService {
    async blockUser(userId, targetUserId) {
        // check xem có mục tiêu block không?
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target)
            throw new AppError("USER_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        return prisma.$transaction(async (tx) => {
            // check đã block chưa
            const existing = await tx.userBlock.findUnique({
                where: {
                    blockerId_blockedId: {
                        blockerId: userId,
                        blockedId: targetUserId,
                    },
                },
                select: {
                    id: true,
                },
            });
            if (existing) {
                return serializeBigInt(existing);
            }
            // chư thì block
            const blocked = await tx.userBlock.create({
                data: {
                    blockerId: userId,
                    blockedId: targetUserId,
                },
            });
            return serializeBigInt(blocked);
        });
    }
    async unblockUser(userId, targetUserId) {
        // check mục tiêu
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target)
            throw new AppError("USER_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        // đã block chưa
        const existing = await prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId: userId,
                    blockedId: targetUserId,
                },
            },
        });
        if (!existing) return null;
        // chưa thì block
        await prisma.userBlock.delete({
            where: {
                blockerId_blockedId: {
                    blockerId: userId,
                    blockedId: targetUserId,
                },
            },
        });
        return serializeBigInt(existing);
    }
    async searchUsers(userId, keyword) {
        const user = await prisma.user.findUnique({
            where: { phonenumber: keyword },
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                backgroundUrl: true,
                birthday: true,
                bio: true,
                phonenumber: true,
                gender: true,
                emailVerifiedAt: true,
            },
        });

        if (!user) {
            throw new AppError("USER_NOT_FOUND", HTTP_STATUS.BAD_REQUEST);
        }

        return serializeBigInt(user);
    }
}

export default new UserService();
