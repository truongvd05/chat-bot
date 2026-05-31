import prisma from "#libs/prisma.js";

export default async function registerAdminSocket(io, socket) {
    socket.on("join-admin", async () => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: BigInt(socket.userId) },
                select: { role: true, status: true },
            });

            if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
                return;
            }

            socket.join("admin-room");

            await emitStatsUpdate(io);
        } catch (err) {
            console.error("join-admin error:", err);
        }
    });
}

export async function emitStatsUpdate(io) {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [totalUsers, newUsersToday, messagesToday, groupsToday] =
            await Promise.all([
                prisma.user.count({
                    where: { status: "ACTIVE" },
                }),

                prisma.user.count({
                    where: { createdAt: { gte: startOfDay } },
                }),

                prisma.message.count({
                    where: { createdAt: { gte: startOfDay } },
                }),

                prisma.conversation.count({
                    where: {
                        type: "GROUP",
                        createdAt: { gte: startOfDay },
                        deletedAt: null,
                    },
                }),
            ]);

        io.to("admin-room").emit("dashboard:stats", {
            totalUsers,
            newUsersToday,
            messagesToday,
            groupsToday,
        });
    } catch (err) {
        console.error("emitStatsUpdate error:", err);
    }
}
