import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";

export async function ensureConversationMember(
    conversationId,
    userId,
    db = prisma,
) {
    // check nếu conversation là bot thì không có bảng quan hệ với conversationParticipant
    const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, type: true },
    });

    if (!conversation || conversation.deletedAt) {
        throw new AppError("Conversation not found", HTTP_STATUS.NOT_FOUND);
    }

    // còn lại thì check
    const participant = await db.conversationParticipant.findUnique({
        where: {
            conversationId_userId: { conversationId, userId },
        },
    });

    if (!participant || participant.leftAt) {
        throw new AppError(
            "User not found in conversation",
            HTTP_STATUS.NOT_FOUND,
        );
    }

    return { conversation, participant };
}
