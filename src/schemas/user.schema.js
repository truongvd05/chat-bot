import { z } from "zod";

export const searchUsersSchema = z.object({
    q: z.string().trim().min(1, "Từ khóa không được để trống").max(50),
});

export const editUserSchema = z.object({
    name: z
        .string({ required_error: "Tên không được để trống" })
        .min(1, "Tên không được để trống")
        .max(50, "Tên không được vượt quá 50 ký tự")
        .trim(),

    bio: z
        .string()
        .max(200, "Bio không được vượt quá 200 ký tự")
        .trim()
        .optional(),

    birthday: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ (YYYY-MM-DD)")
        .refine((val) => !isNaN(Date.parse(val)), "Ngày sinh không tồn tại")
        .refine(
            (val) => new Date(val) < new Date(),
            "Ngày sinh phải nhỏ hơn hôm nay",
        )
        .optional(),

    gender: z
        .enum(["Nam", "Nữ"], { message: "Giới tính phải là Nam hoặc Nữ" })
        .optional(),
});
