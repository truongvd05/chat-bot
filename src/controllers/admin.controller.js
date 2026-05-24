import { HTTP_STATUS } from "#config/constants.js";
import {
    banUserSchema,
    editUserBodySchema,
    editUserParamsSchema,
    getGroupsSchema,
    getUsersSchema,
} from "#schemas/admin.schema.js";
import { loginSchema } from "#schemas/auth.schema.js";
import adminService from "#services/admin.service.js";
import AppError from "#utils/AppError.js";

class AdminController {
    async login(req, res) {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { email, password } = result.data;

        const { user, token } = await adminService.login(email, password);

        return res.success({ user, token }, 200);
    }
    async getUsers(req, res) {
        const result = getUsersSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { page, limit, search } = result.data;

        const users = await adminService.getUsers(page, limit, search);

        return res.success(users, HTTP_STATUS.OK);
    }
    async getGroups(req, res) {
        const result = getGroupsSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const { page, limit } = result.data;

        const groups = await adminService.getGroups(page, limit);

        return res.success(groups, HTTP_STATUS.OK);
    }
    async banUser(req, res) {
        const result = banUserSchema.safeParse(req.params);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { id } = result.data;
        const ban = await adminService.banUser(id);

        return res.success(ban, HTTP_STATUS.OK);
    }
    async unbanUser(req, res) {
        const result = banUserSchema.safeParse(req.params);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { id } = result.data;
        const unban = await adminService.unbanUser(id);

        return res.success(unban, HTTP_STATUS.OK);
    }
    async deleteGroup(req, res) {
        const result = deleteGroupSchema.safeParse(req.params);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { id } = result.data;
        const deleteGroup = await adminService.deleteGroup(id);

        return res.success(deleteGroup, HTTP_STATUS.NO_CONTENT);
    }
    async getTodayStats(req, res) {
        const data = await adminService.getTodayStats();
        return res.success(data, HTTP_STATUS.OK);
    }
    async editUser(req, res) {
        const paramsResult = editUserParamsSchema.safeParse(req.params);

        if (!paramsResult.success) {
            throw new AppError(
                paramsResult.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const bodyResult = editUserBodySchema.safeParse(req.body);
        if (!bodyResult.success) {
            throw new AppError(
                bodyResult.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { id } = paramsResult.data;
        const editUser = await adminService.editUser(id, bodyResult.data);

        return res.success(editUser, HTTP_STATUS.NO_CONTENT);
    }
}

export default new AdminController();
