import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";

export async function ensureMessageOwner(messageId, userId) {
    const message = await prisma.message.findFirst({
        where: {
            id: messageId,
            userId,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });
    if (!message) {
        throw new AppError("MESSAGE_NOT_FOUND", HTTP_STATUS.NOT_FOUND);
    }
}
