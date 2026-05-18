import { z } from "zod";

export const searchUsersSchema = z.object({
    q: z.string().trim().min(1, "Từ khóa không được để trống").max(50),
});
