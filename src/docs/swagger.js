import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const filePath = path.resolve("src/docs/openapi.yaml");
const swaggerDocument = yaml.load(fs.readFileSync(filePath, "utf8"));

export const swaggerSetup = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(swaggerDocument),
};
