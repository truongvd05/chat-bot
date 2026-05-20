import prisma from "#libs/prisma.js";

export function findUserById(id) {
    return prisma.user.findUnique({
        where: {
            id,
        },
    });
}
