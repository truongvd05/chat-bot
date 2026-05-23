import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";

class AdminService {
    async getUsers(page, limit, search) {
        const skip = (page - 1) * limit;
        const where = {
            ...(search && {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        email: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        phonenumber: {
                            contains: search,
                            mode: "insensitive",
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

    async banUser(id) {
        const result = await prisma.user.update({
            where: { id },
            data: {
                status: "BAN",
            },
        });
        return serializeBigInt(result);
    }

    async unbanUser(id) {
        const result = await prisma.user.update({
            where: { id: BigInt(id) },
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
}

export default new AdminService();
