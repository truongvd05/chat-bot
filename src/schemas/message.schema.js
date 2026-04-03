// schemas/message.schema.js
import { z } from "zod";

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message content is required"),
});

export const getMessagesSchema = z.object({
    c: z.string().optional(),
    limit: z.coerce.number().int().positive().default(10),
});
