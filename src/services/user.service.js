import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";

class UserService {
    async getFriend(userId) {
        const friends = await prisma.friend.findMany({
            where: {
                OR: [{ requesterId: userId }, { addresseeId: userId }],
                status: "ACCEPTED",
            },
            select: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        const result = friends.map((f) =>
            f.requester.id === userId ? f.addressee : f.requester,
        );
        return serializeBigInt(result);
    }

    async getFriendRequest(userId) {
        const friends = await prisma.friend.findMany({
            where: {
                OR: [{ requesterId: userId }, { addresseeId: userId }],
                status: "PENDING",
            },
            select: {
                id: true,
                status: true,
                requester: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        const result = friends.map((f) => {
            const otherUser =
                f.requester.id === userId ? f.addressee : f.requester;
            const isRequester = f.requester.id === userId;
            return {
                friendRequestId: f.id,
                status: f.status,
                isRequester, // true = mình đã gửi, false = người khác gửi cho mình
                ...otherUser,
            };
        });
        return serializeBigInt(result);
    }
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
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            });
            if (existing) {
                return serializeBigInt(existing);
            }
            // chưa thì block
            const blocked = await tx.userBlock.upsert({
                where: {
                    blockerId_blockedId: {
                        blockerId: userId,
                        blockedId: targetUserId,
                    },
                },
                update: { deletedAt: null },
                create: {
                    blockerId: userId,
                    blockedId: targetUserId,
                },
            });

            // xóa lời mời kết bạn hoặc xóa bạn bè nếu block nhau
            await tx.friend.deleteMany({
                where: {
                    OR: [
                        { requesterId: userId, addresseeId: targetUserId },
                        { requesterId: targetUserId, addresseeId: userId },
                    ],
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
                deletedAt: null,
            },
        });
        if (!existing) return true;
        // chưa thì unblock
        const unblocked = await prisma.userBlock.delete({
            where: {
                blockerId_blockedId: {
                    blockerId: userId,
                    blockedId: targetUserId,
                },
            },
            data: { deletedAt: new Date() },
        });
        return serializeBigInt(unblocked);
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
            throw new AppError("USER_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
        }

        return serializeBigInt(user);
    }
    async addFriend(userId, targetUserId) {
        // Check xem có bị block không (cả 2 chiều)
        const block = await prisma.userBlock.findFirst({
            where: {
                OR: [
                    { blockerId: userId, blockedId: targetUserId },
                    { blockerId: targetUserId, blockedId: userId },
                ],
            },
        });
        if (block) {
            throw new AppError(
                "Không thể kết bạn do bị block",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        // check xem đã gửi lời mời chưa
        const existing = await prisma.friend.findUnique({
            where: {
                requesterId_addresseeId: {
                    requesterId: userId,
                    addresseeId: targetUserId,
                },
            },
        });
        // gửi rồi thì
        if (existing) return true;

        const [add] = await prisma.$transaction([
            prisma.friend.create({
                data: {
                    requesterId: userId,
                    addresseeId: targetUserId,
                    status: "PENDING",
                },
            }),
            prisma.notification.create({
                data: {
                    receiverId: targetUserId, // người được gửi lời mời
                    senderId: userId, // người gửi
                    type: "FRIEND_REQUEST",
                },
            }),
        ]);

        return serializeBigInt(add);
    }
    async acceptFriend(userId, targetUserId) {
        const request = await prisma.friend.findUnique({
            where: {
                requesterId_addresseeId: {
                    requesterId: targetUserId,
                    addresseeId: userId,
                },
                status: "PENDING",
            },
        });
        if (!request) {
            throw new AppError(
                "Không tìm thấy lời mời kết bạn",
                HTTP_STATUS.NOT_FOUND,
            );
        }
        const [accept] = await prisma.$transaction([
            prisma.friend.update({
                where: {
                    requesterId_addresseeId: {
                        requesterId: targetUserId,
                        addresseeId: userId,
                    },
                },
                data: { status: "ACCEPTED" },
            }),
            prisma.notification.create({
                data: {
                    receiverId: targetUserId, // người gửi lời mời nhận thông báo
                    senderId: userId, // người chấp nhận
                    type: "FRIEND_ACCEPTED",
                },
            }),
        ]);
        return serializeBigInt(accept);
    }
}

export default new UserService();
