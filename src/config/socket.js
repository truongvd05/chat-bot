import { Server } from "socket.io";
import registerChatSocket from "#socket/chat.socket.js";

export function initSocket(server) {
    const io = new Server(server, {
        pingInterval: 25000,
        pingTimeout: 60000,
        cors: {
            origin: [
                "http://103.118.29.46",
                "http://chatdemo.site",
                "https://chatdemo.site",
                "http://localhost:5173",
                process.env.CLIENT_URL,
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        registerChatSocket(io, socket);
    });
}
