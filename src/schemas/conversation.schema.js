// schemas/conversation.schema.js
import { z } from "zod";

const bigIntIdSchema = z
    .union([z.string().regex(/^\d+$/), z.number().int().positive()])
    .transform((val) => BigInt(val));

export const createBotConversationSchema = z.object({
    title: z.string().min(1, "Title is required").max(255, "TITLE_TOO_LONG"),
});

export const createGroupConversationSchema = z.object({
    name: z.string().min(1, "INVALID_name").max(255, "TITLE_TOO_LONG"),
    members: z.array(bigIntIdSchema).min(1, "Group phải có ít nhất 1 member"),
});

export const renameConversationSchema = z.object({
    title: z.string().min(1, "INVALID_TITLE").max(255, "TITLE_TOO_LONG"),
});

export const membersSchema = z.object({
    members: z.array(bigIntIdSchema).min(1, "Phải thêm ít nhất 1 thành viên"),
});

export const searchSchema = z.object({
    q: z.string().min(1, "INVALID_OR_MISSING_QUERY"),
});
