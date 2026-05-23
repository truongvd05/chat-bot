import { z } from "zod";

export const getUsersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().default(""),

    status: z.enum(["ACTIVE", "BAN"]).optional(),
});

export const banUserSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const getGroupsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
});
