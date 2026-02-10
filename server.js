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

var app = express();

const port = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
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
    optionsSuccessStatus: 200,
};
app.use("/docs", swaggerSetup.serve, swaggerSetup.setup);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(responseFormat);
app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandle);
app.use(exceptionHandler);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
