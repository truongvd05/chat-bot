import jwtconfig from "#config/jwt.js";
import prisma from "#libs/prisma.js";
import conversationService from "#services/conversation.service.js";
import messageService from "#services/message.service.js";
import jwt from "jsonwebtoken";

export default function registerChatSocket(io, socket) {
    const token = socket.handshake.auth.token;
    try {
        const decoded = jwt.verify(token, jwtconfig.secret);
        socket.user = decoded;
        socket.join(`user_${socket.user?.sub}`);
    } catch (err) {
        socket.disconnect();
        return;
    }

    socket.on("send_message", async ({ conversationId, content }) => {
        if (!content?.trim()) {
            return socket.emit("error_message", "Tin nhắn không hợp lệ");
        }
        try {
            const senderId = socket.user.sub;
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

            // lây thành viên
            const participants =
                await conversationService.finDparticipants(conversationId);

            // emit cho từng thành viên
            participants.forEach((p) => {
                io.to(`user_${p.userId}`).emit("receive_message", message);
            });
        } catch (err) {
            console.error("Send message error:", err);
            socket.emit("error_message", "Không gửi được tin nhắn");
        }
    });
}
