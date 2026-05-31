import prisma from "#libs/prisma.js";
import aiService from "#services/ai.service.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import AppError from "#utils/AppError.js";
import { emitStatsUpdate } from "./admin.socket.js";

export default function registerMessageSocket(io, socket, onlineUsers) {
    socket.on(
        "send_message",
        async ({ conversationId, content, parentMessageId }) => {
            if (!content?.trim()) {
                return socket.emit("error_message", "Tin nhắn không hợp lệ");
            }
            try {
                const senderId = socket.userId;
                const message = await messageService.sendMessage(
                    conversationId,
                    senderId,
                    content,
                    [],
                    parentMessageId ?? null,
                );

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

                const conversation =
                    await conversationService.findById(conversationId);

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
                    // Chỉ suggest cho DIRECT conversation
                    if (conversation.type === "DIRECT") {
                        // Check online qua onlineUsers Map
                        if (!onlineUsers?.has(String(p.userId))) continue;

                        // Check setting tắt/bật gợi ý
                        const setting = await prisma.user.findUnique({
                            where: { id: BigInt(p.userId) },
                            select: { aiSuggest: true },
                        });
                        if (!setting?.aiSuggest) continue;
                        aiService
                            .suggest(content, conversationId, p.userId, io)
                            .catch((err) =>
                                console.error("AI suggest error:", err),
                            );
                    }
                }
                emitStatsUpdate(io).catch((err) =>
                    console.error("emitStatsUpdate error:", err),
                );
            } catch (err) {
                console.error("Send message error:", err);
                socket.emit("error_message", {
                    message:
                        err instanceof AppError ? err.message : "Lỗi hệ thống",
                    statusCode: err instanceof AppError ? err.statusCode : 500,
                });
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

    socket.on("delete_message", async ({ messageId, conversationId }) => {
        try {
            const userId = socket.userId;
            const message = await messageService.deleteMessage(
                userId,
                messageId,
                conversationId,
            );

            const participants =
                await conversationService.finDparticipants(conversationId);

            for (const p of participants) {
                io.to(`user_${p.userId}`).emit("message_deleted", message);
            }
        } catch (err) {
            console.error("Edit message error:", err);
            socket.emit("error_message", "Không xóa được tin nhắn");
        }
    });
}
