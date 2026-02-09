import express from "express";
import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const postfix = ".router.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = readdirSync(__dirname).filter((_name) => _name.endsWith(postfix));

for (const fileName of files) {
    const resource = fileName.replace(postfix, "");
    const module = await import(`./${fileName}`);
    router.use(`/${resource}`, module.default);
}

export default router;
