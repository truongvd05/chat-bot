// schemas/auth.schema.js
import { z } from "zod";

export const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirm_password: z.string(),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const verifyEmailSchema = z.object({
    token: z.string().min(1, "Missing token"),
});

export const refreshTokenSchema = z.object({
    refresh_token: z.string().min(1, "MISSING_REFRESH_TOKEN"),
});

export const changePasswordSchema = z
    .object({
        password: z.string().min(1, "Missing password"),
        new_password: z
            .string()
            .min(6, "Password must be at least 6 characters"),
        confirm_password: z.string(),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid or missing email"),
});

export const resetPasswordSchema = z
    .object({
        password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
        new_password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
    })
    .refine((data) => data.password === data.new_password, {
        message: "Mật khẩu không khớp",
        path: ["new_password"],
    });

export const validateEmailSchema = z.object({
    email: z.string().email("Invalid email format"),
});
