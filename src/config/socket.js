import { Server } from "socket.io";
import registerChatSocket from "#socket/chat.socket.js";

export function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://truongvd05.github.io",
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
