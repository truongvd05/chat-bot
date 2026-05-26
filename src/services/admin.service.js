import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";
import bcrypt from "bcrypt";
import responseTokenService from "./responseToken.service.js";
import authService from "./auth.service.js";

class AdminService {
    async login(email, password) {
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user)
            throw new AppError(
                "sai tài khoản hoặc mật khẩu",
                HTTP_STATUS.UNAUTHORIZED,
            );

        if (user.role === "USER")
            throw new AppError("FORBIDDEN", HTTP_STATUS.FORBIDDEN);

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            throw new AppError(
                "sai tài khoản hoặc mật khẩu",
                HTTP_STATUS.UNAUTHORIZED,
            );
        }

        const token = responseTokenService.loginAndRegister(user.id);

        await authService._updateUserRefreshToken(
            user.id,
            token.refresh_token,
            token.refresh_token_ttl,
        );
        const { password: _, ...saveUser } = user;

        return { user: serializeBigInt(saveUser), token };
    }
    async getUsers(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = {
            ...(search && {
                OR: [
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        email: {
                            contains: search,
                        },
                    },
                    {
                        phonenumber: {
                            contains: search,
                        },
                    },
                ],
            }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phonenumber: true,
                    gender: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                    emailVerifiedAt: true,
                    createdAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users: serializeBigInt(users),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getGroups(page, limit) {
        const skip = (page - 1) * limit;
        const where = {
            type: "GROUP",
            deletedAt: null,
        };

        const [groups, total] = await Promise.all([
            prisma.conversation.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    lastMessageAt: true,
                    type: true,
                    status: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            participants: {
                                where: { deletedAt: null, leftAt: null },
                            },
                        },
                    },
                },
            }),
            prisma.conversation.count({ where }),
        ]);

        return {
            groups: serializeBigInt(groups),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async banUser(targetId) {
        const target = await prisma.user.findUnique({
            where: { id: targetId },
        });
        if (!target)
            throw new AppError(
                "Người dùng không tồn tại",
                HTTP_STATUS.NOT_FOUND,
            );
        if (target.role === "ADMIN")
            throw new AppError("Không thể ban admin", HTTP_STATUS.FORBIDDEN);

        const result = await prisma.user.update({
            where: { id: targetId },
            data: {
                status: "BAN",
            },
        });
        return serializeBigInt(result);
    }

    async unbanUser(targetId) {
        const user = await prisma.user.findUnique({ where: { id: targetId } });
        if (!user)
            throw new AppError(
                "Người dùng không tồn tại",
                HTTP_STATUS.NOT_FOUND,
            );

        if (user.status !== "BAN")
            throw new AppError(
                "Người dùng chưa bị khóa",
                HTTP_STATUS.BAD_REQUEST,
            );

        const result = await prisma.user.update({
            where: { id: BigInt(targetId) },
            data: { status: "ACTIVE" },
        });

        return serializeBigInt(result);
    }

    async getTodayStats() {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            newUsersToday,
            bannedUsers,
            messagesToday,
            groupsToday,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: { createdAt: { gte: start } },
            }),
            prisma.user.count({
                where: { status: "BAN" },
            }),
            prisma.message.count({
                where: { createdAt: { gte: start } },
            }),
            prisma.conversation.count({
                where: {
                    type: "GROUP",
                    deletedAt: null,
                    createdAt: { gte: start },
                },
            }),
        ]);

        return {
            totalUsers,
            newUsersToday,
            bannedUsers,
            messagesToday,
            groupsToday,
        };
    }
    async editUser(targetId, data) {
        const user = await prisma.user.findUnique({ where: { id: targetId } });
        if (!user)
            throw new AppError(
                "Người dùng không tồn tại",
                HTTP_STATUS.NOT_FOUND,
            );

        // lọc giá trị undefined
        const updateData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined),
        );

        const edit = await prisma.user.update({
            where: { id: targetId },
            data: updateData,
        });

        return serializeBigInt(edit);
    }

    async deleteGroup(id) {
        const group = await prisma.conversation.findUnique({ where: { id } });

        if (!group)
            throw new AppError("Nhóm không tồn tại", HTTP_STATUS.NOT_FOUND);

        const result = await prisma.conversation.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return serializeBigInt(result);
    }
    async editGroup(id, data) {
        const result = await prisma.conversation.update({
            where: { id },
            data,
        });
        return serializeBigInt(result);
    }
}

export default new AdminService();
