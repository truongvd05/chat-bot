import jwt from "jsonwebtoken";
import jwtconfig from "#config/jwt.js";
import authService from "#services/auth.service.js";
import { extractAccessToken } from "#utils/extractAccessToken.js";

const authMeRequired = async (req, res, next) => {
    try {
        const access_token = extractAccessToken(req);
        if (!access_token) return res.unauthorized();
        const payload = jwt.verify(access_token, jwtconfig.secret);
        if (!payload.jti) {
            return res.error("Invalid token (missing jti)", 401);
        }
        const currentUser = await authService.findUserById(payload.sub);
        if (!currentUser) {
            return res.error({ message: "User not found" }, 401);
        }
        req.user = currentUser;
        req.auth = {
            token: access_token,
            jti: payload.jti,
            exp: payload.exp,
            sub: payload.sub,
        };
        next();
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export default authMeRequired;
