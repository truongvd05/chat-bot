import registerMessageSocket from "./message.socket.js";
import registerTypingSocket from "./typing.socket.js";
import registerUserSocket from "./user.socket.js";

import jwtconfig from "#config/jwt.js";
import jwt from "jsonwebtoken";
import registerAdminSocket from "./admin.socket.js";

const onlineUsers = new Map();
const typingUsers = new Map();

export default function registerChatSocket(io, socket) {
    // auth
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

    // đăng ký từng nhóm, truyền shared state nếu cần
    registerAdminSocket(io, socket);
    registerMessageSocket(io, socket, onlineUsers);
    registerTypingSocket(io, socket, typingUsers);
    registerUserSocket(io, socket, onlineUsers, typingUsers);
}
