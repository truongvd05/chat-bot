import cloudinary from "#config/cloudinary.js";
import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";
import uploadFile from "#utils/uploadFile.js";

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
                        bio: true,
                        gender: true,
                        birthday: true,
                    },
                },
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        bio: true,
                        gender: true,
                        birthday: true,
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
        const unblocked = await prisma.userBlock.update({
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
        const user = await prisma.user.findFirst({
            where: {
                id: { not: userId },
                OR: [{ phonenumber: keyword }, { email: keyword }],
            },
            select: {
                id: true,
                name: true,
                email: true,
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

        // check xem đã gửi lời mời chưa (check 2 chiều )
        const existing = await prisma.friend.findFirst({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: userId },
                ],
            },
        });
        // gửi rồi thì
        if (existing) {
            if (existing.status === "PENDING") {
                // người kia đã gửi mình trước → tự động accept luôn
                if (existing.requesterId === targetUserId) {
                    return this.acceptFriend(userId, targetUserId);
                }
                throw new AppError(
                    "Đã gửi lời mời kết bạn rồi",
                    HTTP_STATUS.CONFLICT,
                );
            }
            if (existing.status === "ACCEPTED") {
                throw new AppError(
                    "Hai người đã là bạn bè",
                    HTTP_STATUS.CONFLICT,
                );
            }
            // bị từ chối thì cho gửi lại
            if (existing.status === "REJECTED") {
                await prisma.friend.delete({
                    where: {
                        requesterId_addresseeId: {
                            requesterId: existing.requesterId,
                            addresseeId: existing.addresseeId,
                        },
                    },
                });
            }
        }

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
    async acceptFriend(userId, requestId) {
        const request = await prisma.friend.findUnique({
            where: {
                requesterId_addresseeId: {
                    requesterId: requestId,
                    addresseeId: userId,
                },
            },
        });

        if (!request || request.status !== "PENDING") {
            throw new AppError(
                "Không tìm thấy lời mời kết bạn",
                HTTP_STATUS.NOT_FOUND,
            );
        }
        const [accept] = await prisma.$transaction([
            prisma.friend.update({
                where: {
                    requesterId_addresseeId: {
                        requesterId: requestId,
                        addresseeId: userId,
                    },
                },
                data: { status: "ACCEPTED" },
            }),
            prisma.notification.create({
                data: {
                    receiverId: requestId, // người gửi lời mời nhận thông báo
                    senderId: userId, // người chấp nhận
                    type: "FRIEND_ACCEPTED",
                },
            }),
        ]);
        return serializeBigInt(accept);
    }

    async rejectFriend(userId, requestId) {
        console.log(userId, requestId);

        const request = await prisma.friend.findFirst({
            where: {
                OR: [
                    { requesterId: requestId, addresseeId: userId },
                    { requesterId: userId, addresseeId: requestId },
                ],
                status: "PENDING",
            },
        });

        console.log(request);

        if (!request) {
            throw new AppError(
                "Không tìm thấy lời mời kết bạn",
                HTTP_STATUS.NOT_FOUND,
            );
        }
        const reject = await prisma.friend.delete({
            where: {
                requesterId_addresseeId: {
                    requesterId: request.requesterId,
                    addresseeId: request.addresseeId,
                },
            },
        });
        return serializeBigInt(reject);
    }
    async updateAvatar(userId, file) {
        // . Lấy avatar cũ để xóa sau
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });

        // Upload file mới lên Cloudinary
        const attachment = await uploadFile(file, {
            folder: "chat-app/avatars",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
            ],
        });

        // Cập nhật URL vào DB
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: attachment.fileUrl },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
        });

        // 4. Xóa ảnh cũ trên Cloudinary (nếu có)
        if (user.avatarUrl) {
            const publicId = user.avatarUrl
                .split("/upload/")[1] // lấy phần sau /upload/
                ?.replace(/^v\d+\//, "") // bỏ version vd: v1234567890/
                ?.replace(/\.[^.]+$/, ""); // bỏ extension

            if (publicId) {
                await cloudinary.uploader.destroy(publicId).catch(() => {
                    console.warn("Failed to delete old avatar:", publicId);
                });
            }
        }

        return serializeBigInt(updated);
    }
    async unFriend(userId, targetUserId) {
        const result = await prisma.friend.deleteMany({
            where: {
                OR: [
                    { requesterId: userId, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: userId },
                ],
                status: "ACCEPTED",
            },
        });

        if (result.count === 0) {
            throw new Error("Friendship not found");
        }

        return true;
    }
    async editUser(userId, data) {
        const update = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                birthday: data.birthday,
                gender: data.gender,
                bio: data.bio,
            },
            select: {
                id: true,
                name: true,
                bio: true,
                birthday: true,
                gender: true,
                avatarUrl: true,
            },
        });

        return serializeBigInt(update);
    }
    async getMe(id) {
        const me = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                password: true,
                name: true,
                bio: true,
                gender: true,
                birthday: true,
                emailVerifiedAt: true,
                createdAt: true,
                status: true,
                avatarUrl: true,
                backgroundUrl: true,
            },
        });
        return serializeBigInt(me);
    }
    async toggleAiSuggest(userId, aiSuggest) {
        const update = await prisma.user.update({
            where: { id: userId },
            data: { aiSuggest },
            select: { aiSuggest: true },
        });
        return serializeBigInt(update);
    }
}

export default new UserService();
