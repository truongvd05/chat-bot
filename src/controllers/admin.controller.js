import { HTTP_STATUS } from "#config/constants.js";
import {
    banUserSchema,
    getGroupsSchema,
    getUsersSchema,
} from "#schemas/admin.schema.js";
import adminService from "#services/admin.service.js";
import AppError from "#utils/AppError.js";

class AdminController {
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
        const result = banUserSchema.safeParse(req.params);
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
}

export default new AdminController();
