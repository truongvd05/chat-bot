import { z } from "zod";

export const sendMessageSchema = z.object({
    content: z.string().optional().default(""),
});

export const getMessagesSchema = z.object({
    c: z.string().regex(/^\d+$/, "Invalid cursor").optional(),
    limit: z.coerce.number().int().positive().default(10),
});
