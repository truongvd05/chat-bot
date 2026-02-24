import userService from "#services/user.service.js";
import AppError from "#utils/AppError.js";

class UserController {
    async blockUser(req, res) {
        const user = req.user;
        if (!user) return res.unauthorized();

        const rawId = req.params.id;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID");
        }
        const targetUserId = BigInt(rawId);

        if (targetUserId === user.id) {
            return res.error("CANNOT_BLOCK_YOURSELF");
        }
        const result = await userService.blockUser(user.id, targetUserId);
        return res.success(result);
    }
    async unblockUser(req, res) {
        const user = req.user;
        if (!user) return res.unauthorized();

        const rawId = req.params.id;
        if (!rawId || !/^\d+$/.test(rawId)) {
            return res.error("INVALID_USER_ID");
        }
        const targetUserId = BigInt(rawId);

        if (targetUserId === user.id) {
            return res.error("CANNOT_UN_BLOCK_YOURSELF");
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
