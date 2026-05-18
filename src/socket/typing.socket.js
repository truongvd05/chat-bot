import prisma from "#libs/prisma.js";
import conversationService from "#services/conversation.service.js";

export default function registerTypingSocket(io, socket, typingUsers) {
    socket.on("typing_start", async ({ conversationId }) => {
        try {
            const senderId = socket.userId;
            // Check quyền
            const isParticipant =
                await prisma.conversationParticipant.findFirst({
                    where: { conversationId, userId: senderId, leftAt: null },
                });
            if (!isParticipant) return;

            // Thêm vào Set
            if (!typingUsers.has(conversationId)) {
                typingUsers.set(conversationId, new Set());
            }
            typingUsers.get(conversationId).add(senderId);

            // Emit mảng userId đang typing cho tất cả trong conversation
            const typingArray = [...typingUsers.get(conversationId)];
            const participants =
                await conversationService.finDparticipants(conversationId);

            for (const p of participants) {
                io.to(`user_${p.userId}`).emit("typing_users", {
                    conversationId,
                    userIds: typingArray,
                });
            }
        } catch (err) {
            console.error("Typing start error:", err);
        }
    });

    socket.on("typing_stop", async ({ conversationId }) => {
        const senderId = socket.userId;

        if (typingUsers.has(conversationId)) {
            typingUsers.get(conversationId).delete(senderId);

            const typingArray = [...typingUsers.get(conversationId)];
            const participants =
                await conversationService.finDparticipants(conversationId);

            for (const p of participants) {
                io.to(`user_${p.userId}`).emit("typing_users", {
                    conversationId,
                    userIds: typingArray,
                });
            }
        }
    });
}
