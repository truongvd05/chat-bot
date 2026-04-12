// middlewares/cache.middleware.js
import { HTTP_STATUS } from "#config/constants.js";
import redis from "#config/redis.js";

export const cacheMiddleware =
    (keyFn, ttl = 300) =>
    async (req, res, next) => {
        const key = keyFn(req);
        const cached = await redis.get(key);
        if (cached) {
            return res.success(JSON.parse(cached), HTTP_STATUS.OK);
        }
        res.setCache = (data) => redis.setEx(key, ttl, JSON.stringify(data));
        next();
    };
