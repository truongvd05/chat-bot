import jwtconfig from "#config/jwt.js";
import prisma from "#libs/prisma.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import jwt from "jsonwebtoken";

const onlineUsers = new Map();
const typingUsers = new Map();

export default function registerChatSocket(io, socket) {
    const token = socket.handshake.auth.token;
    let userId;
    try {
        const decoded = jwt.verify(token, jwtconfig.secret);
        userId = decoded.sub;
        socket.userId = userId;

        socket.join(`user_${userId}`);

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, 0);
            io.emit("user_online", userId);
        }

        onlineUsers.set(userId, onlineUsers.get(userId) + 1);
        io.emit("online_users", Array.from(onlineUsers.keys()));
    } catch (err) {
        socket.disconnect();
        return;
    }

    socket.on("send_message", async ({ conversationId, content }) => {
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
                role: "user",
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
                io.to(`user_${p.userId}`).emit("unread_count", conversation);
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
    });
    // typing
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

    socket.on("disconnect", () => {
        const userId = socket.userId;
        if (!userId) return;

        const count = (onlineUsers.get(userId) || 1) - 1;

        if (count <= 0) {
            onlineUsers.delete(userId);
        } else {
            onlineUsers.set(userId, count);
        }

        io.emit("online_users", Array.from(onlineUsers.keys()));
        // Xóa khỏi tất cả typing khi disconnect
        for (const [convId, users] of typingUsers.entries()) {
            if (users.has(userId)) {
                users.delete(userId);
                const typingArray = [...users];
                io.to(`conversation_${convId}`).emit("typing_users", {
                    conversationId: convId,
                    userIds: typingArray,
                });
            }
        }
    });
}
