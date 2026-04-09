import { Server } from "socket.io";
import registerChatSocket from "#socket/chat.socket.js";

export function initSocket(server, app) {
    const io = new Server(server, {
        pingInterval: 25000,
        pingTimeout: 60000,
        cors: {
            origin: [
                "http://103.195.239.195",
                "http://chatdemo.site",
                "https://chatdemo.site",
                "http://localhost:5173",
                "http://localhost:5174",
                process.env.CLIENT_URL,
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    app.set("io", io);
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        registerChatSocket(io, socket);
    });
}
