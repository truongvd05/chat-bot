import "dotenv/config";
import cors from "cors";
import express from "express";
import responseFormat from "#middlewares/responseFormat.js";
import errorHandle from "#middlewares/errorHandle.js";
import notFoundHandler from "#middlewares/notFoundHandler.js";
import exceptionHandler from "#middlewares/exceptionHandler.js";
import router from "#router/index.js";
import { swaggerSetup } from "./src/docs/swagger.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { initSocket } from "#config/socket.js";
import http from "http";
import path from "path";
import "#config/redis.js";

var app = express();

const server = http.createServer(app);

initSocket(server, app);

const port = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
    "http://103.195.239.195",
    "http://chatdemo.site",
    "https://chatdemo.site",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://localhost",
    process.env.CLIENT_URL,
].filter(Boolean);

const allowMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        } else {
            callback(new Error("Not allow by cors"));
        }
    },
    methods: allowMethods,
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(responseFormat);
app.use("/uploads", express.static(path.join(process.cwd(), "src/uploads")));
app.use("/docs", swaggerSetup.serve, swaggerSetup.setup);
app.use("/api", router);
app.get("/", (req, res) => {
    res.send("hello");
});
app.use(notFoundHandler);
app.use(errorHandle);
app.use(exceptionHandler);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
