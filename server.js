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

var app = express();
console.log("KEY:", process.env.AI_GATEWAY_API_KEY);
const server = http.createServer(app);

initSocket(server);

const port = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "https://truongvd05.github.io",
    "http://103.118.29.46",
    process.env.CLIENT_URL,
];
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

app.get("/", (req, res) => {
    res.send("hello");
});

app.use(cors(corsOptions));
app.use("/docs", swaggerSetup.serve, swaggerSetup.setup);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(responseFormat);
app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandle);
app.use(exceptionHandler);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
