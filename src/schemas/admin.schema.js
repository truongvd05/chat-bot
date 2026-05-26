import { z } from "zod";

export const getUsersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().default(""),

    status: z.enum(["ACTIVE", "BAN"]).optional(),
});

export const statusGroupSchema = z.object({
    status: z.enum(["LOCKED", "ACTIVE"]),
});

export const banUserSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const deleteGroupSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const editGroupSchema = z
    .object({
        status: z.enum(["LOCKED", "ACTIVE"]).optional(),
        title: z.string().min(1).optional(),
    })
    .refine((data) => data.status || data.title, {
        message: "Phải có status hoặc title",
    });

export const getGroupsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const editUserParamsSchema = z.object({
    id: z.string().min(1, "Thiếu id"),
});

// chuyển chuỗi rỗng qua null vì db không được trống
const emptyStringToNull = z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional(),
);

export const editUserBodySchema = z
    .object({
        name: z.string().min(1, "Tên không được để trống").optional(),
        email: z.string().email("Email không hợp lệ").optional(),
        phonenumber: emptyStringToNull,
        gender: z.preprocess(
            (val) => (val === "" ? null : val),
            z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
        ),
        bio: emptyStringToNull,
        birthday: emptyStringToNull,
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Phải có ít nhất 1 trường cần cập nhật",
    });
