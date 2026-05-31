import { Server } from "socket.io";
import { setIO } from "#libs/socket.instance.js";
import registerChatSocket from "#socket/index.js";

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
                "http://localhost:8080",
                "http://localhost:8181",
                "http://localhost:81",
                "http://localhost",
                process.env.CLIENT_URL,
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    setIO(io);
    app.set("io", io);
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        registerChatSocket(io, socket);
    });
}
