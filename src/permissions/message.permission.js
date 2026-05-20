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
        throw new AppError("MESSAGE_NOT_FOUND_OR_FORBIDDEN");
    }
}
