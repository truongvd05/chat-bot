import userService from "#services/user.service.js";

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
}

export default new UserController();
