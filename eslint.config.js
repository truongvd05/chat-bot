import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/*.min.js",
        ],
    },
    {
        files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
        rules: {
            "prefer-const": "warn",
            "no-constant-binary-expression": "error",
        },
    },
]);
