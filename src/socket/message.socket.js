import prisma from "#libs/prisma.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";

export default function registerMessageSocket(io, socket) {
    socket.on(
        "send_message",
        async ({ conversationId, content, replyToId, parentMessageId }) => {
            if (!content?.trim()) {
                return socket.emit("error_message", "Tin nhắn không hợp lệ");
            }
            try {
                const senderId = socket.userId;
                // check quyền
                const isParticipant =
                    await prisma.conversationParticipant.findFirst({
                        where: {
                            conversationId,
                            userId: senderId,
                            leftAt: null,
                        },
                    });
                if (!isParticipant) {
                    return socket.emit(
                        "error_message",
                        "Không có quyền gửi tin nhắn",
                    );
                }

                const message = await messageService._createMessage({
                    conversationId,
                    userId: senderId,
                    content,
                    replyToId,
                    role: "user",
                    parentMessageId: parentMessageId ?? null,
                });

                const conversation =
                    await conversationService.findConversationSocket(
                        conversationId,
                    );

                // update lassmessage
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: {
                        lastMessageId: message.id,
                        lastMessageAt: message.createdAt,
                    },
                });
                // lây thành viên
                const participants =
                    await conversationService.finDparticipants(conversationId);

                // tăng unread cho người KHÔNG phải sender
                await prisma.conversationParticipant.updateMany({
                    where: {
                        conversationId,
                        userId: {
                            not: senderId,
                        },
                    },
                    data: {
                        unreadCount: { increment: 1 },
                    },
                });

                for (const p of participants) {
                    // emit cho từng thành viên
                    io.to(`user_${p.userId}`).emit("receive_message", message);
                    io.to(`user_${p.userId}`).emit(
                        "unread_count",
                        conversation,
                    );
                    // emit conversation tạo mới
                    io.to(`user_${p.userId}`).emit(
                        "conversation_updated",
                        conversation,
                    );
                    // Emit notification
                    if (p.userId !== senderId) {
                        io.to(`user_${p.userId}`).emit("new_notification", {
                            type: "NEW_MESSAGE",
                            conversationId,
                            fromUserId: senderId,
                        });
                    }
                }
            } catch (err) {
                console.error("Send message error:", err);
                socket.emit("error_message", "Không gửi được tin nhắn");
            }
        },
    );

    socket.on(
        "edit_message",
        async ({ messageId, conversationId, content }) => {
            try {
                const userId = socket.userId;
                const edit = await messageService.editMessage(
                    userId,
                    messageId,
                    conversationId,
                    content,
                    io,
                );

                const participants =
                    await conversationService.finDparticipants(conversationId);
                for (const p of participants) {
                    io.to(`user_${p.userId}`).emit("message_edited", edit);
                }
            } catch (err) {
                console.error("Edit message error:", err);
                socket.emit("error_message", "Không sửa được tin nhắn");
            }
        },
    );

    socket.on("delete_message", async ({ messageId }) => {
        // ... logic delete
    });
}
