import { z } from "zod";

export const registerSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        phonenumber: z
            .string()
            .min(10, "Phone must be at least 10 digits")
            .max(11, "Phone must be at most 11 digits")
            .regex(
                /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                "Invalid Vietnamese phone number",
            ),
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

export const forgotPasswordByPhoneSchema = z.object({
    phone_number: z
        .string()
        .min(1, "Số điện thoại không được để trống")
        .regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại không hợp lệ"),
    firebase_token: z.string().min(1, "Token xác thực không được để trống"),
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

export const validatePhoneSchema = z.object({
    phonenumber: z
        .string()
        .trim()
        .regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Invalid phone number format"),
});
