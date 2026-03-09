import { Server } from "socket.io";
import registerChatSocket from "#socket/chat.socket.js";

export function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: [
                "https://truongvd05.github.io",
                "http://103.118.29.46",
                "http://chatdemo.site",
                "https://chatdemo.site",
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
