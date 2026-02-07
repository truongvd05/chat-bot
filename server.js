import "dotenv/config";
import cors from "cors";
import express from "express";
import responseFormat from "#middlewares/responseFormat.js";
import errorHandle from "#middlewares/errorHandle.js";
import notFoundHandler from "#middlewares/notFoundHandler.js";
import exceptionHandler from "#middlewares/exceptionHandler.js";
import router from "#router/index.js";

var app = express();

const port = process.env.PORT || 3000;

const ALLOWED_ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";

let allowMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

let corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === ALLOWED_ORIGIN) {
            return callback(null, true);
        } else {
            callback(new Error("Not allow by cors"));
        }
    },
    methods: allowMethods,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(responseFormat);
app.use("/api", router);
app.use(notFoundHandler);
app.use(errorHandle);
app.use(exceptionHandler);

app.listen(port, "127.0.0.1", () => {
    console.log("Listening on 127.0.0.1:3000");
});
