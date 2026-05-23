import { HTTP_STATUS } from "#config/constants.js";

const isAdmin = (req, res, next) => {
    const user = req.user;

    if (user.role !== "ADMIN")
        return res.error("Không có quyền", HTTP_STATUS.FORBIDDEN);
    next();
};

export default isAdmin;
