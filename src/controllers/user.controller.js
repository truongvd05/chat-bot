import { HTTP_STATUS } from "#config/constants.js";
import { searchUsersSchema } from "#schemas/user.schema.js";
import userService from "#services/user.service.js";
import AppError from "#utils/AppError.js";

class UserController {
    async blockUser(req, res) {
        const user = req.user;
        const targetUserId = req.targetUserId;

        if (targetUserId === user.id) {
            throw new AppError(
                "CANNOT_BLOCK_YOURSELF",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const result = await userService.blockUser(user.id, targetUserId);
        return res.success(result);
    }
    async unblockUser(req, res) {
        const user = req.user;
        if (!user) return res.unauthorized();

        const targetUserId = req.id;

        if (targetUserId === user.id) {
            throw new AppError(
                "CANNOT_BLOCK_YOURSELF",
                HTTP_STATUS.BAD_REQUEST,
            );
        }
        const result = await userService.unblockUser(user.id, targetUserId);
        return res.success(result);
    }
    async searchUsers(req, res) {
        const user = req.user;

        const result = searchUsersSchema.safeParse(req.query);
        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const { q } = result.data;

        const search = await userService.searchUsers(user.id, q);
        return res.success(search, HTTP_STATUS.OK);
    }
}

export default new UserController();
