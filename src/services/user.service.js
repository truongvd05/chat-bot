import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";

class UserService {
    async blockUser(userId, targetUserId) {
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target) throw new Error("USER_NOT_FOUND");
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
            // create block
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
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true },
        });

        if (!target) throw new Error("USER_NOT_FOUND");
        const existing = await prisma.userBlock.findUnique({
            where: {
                blockerId_blockedId: {
                    blockerId: userId,
                    blockedId: targetUserId,
                },
            },
        });
        if (!existing) return null;
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
}

export default new UserService();
