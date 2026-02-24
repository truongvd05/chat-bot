import { HTTP_STATUS } from "#config/constants.js";
import userService from "#services/user.service.js";
import AppError from "#utils/AppError.js";

class UserController {
    async blockUser(req, res) {
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
        const { q } = req.query;
        if (!q) throw new AppError("Invalid or missing querry");
        const result = await userService.searchUsers(q);
        return res.success(result);
    }
}

export default new UserController();
