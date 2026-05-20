import prisma from "#libs/prisma.js";

export function findUserById(userId) {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
}
