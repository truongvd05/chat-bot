import { HTTP_STATUS } from "#config/constants.js";
import { editUserSchema, searchUsersSchema } from "#schemas/user.schema.js";
import userService from "#services/user.service.js";
import AppError from "#utils/AppError.js";

class UserController {
    async getFriend(req, res) {
        const user = req.user;

        const friends = await userService.getFriend(user.id);

        return res.success(friends, HTTP_STATUS.OK);
    }
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
        return res.success(result, HTTP_STATUS.OK);
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
    async getFriendRequest(req, res) {
        const user = req.user;
        const result = await userService.getFriendRequest(user.id);
        return res.success(result, HTTP_STATUS.OK);
    }
    async addFriend(req, res) {
        const user = req.user;
        const targetUserId = req.targetUserId;
        const add = await userService.addFriend(user.id, targetUserId);
        return res.success(add, HTTP_STATUS.OK);
    }
    async acceptFriend(req, res) {
        const user = req.user;
        const targetUserId = req.targetUserId;
        const add = await userService.acceptFriend(user.id, targetUserId);
        return res.success(add, HTTP_STATUS.OK);
    }
    async updateAvatar(req, res) {
        const user = req.user;
        const file = req.file;
        if (!file) {
            throw new AppError("No file uploaded", HTTP_STATUS.BAD_REQUEST);
        }

        const upload = await userService.updateAvatar(user.id, file);

        return res.success(upload, HTTP_STATUS.OK);
    }
    async editUser(req, res) {
        const result = editUserSchema.safeParse(req.body);

        if (!result.success) {
            throw new AppError(
                result.error.issues[0].message || "lỗi",
                HTTP_STATUS.BAD_REQUEST,
            );
        }

        const user = req.user;

        const { name, bio, birthday, gender } = result.data;

        const updatedUser = await userService.editUser(user.id, {
            name,
            bio,
            birthday,
            gender,
        });

        return res.success(updatedUser, HTTP_STATUS.OK);
    }
    async getMe(req, res) {
        const user = req.user;
        const me = userService.getMe(user.id);
        return res.success(me, HTTP_STATUS.OK);
    }
}

export default new UserController();
