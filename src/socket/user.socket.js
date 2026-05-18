export default function registerUserSocket(
    io,
    socket,
    onlineUsers,
    typingUsers,
) {
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
