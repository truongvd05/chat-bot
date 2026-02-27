const refreshMap = new Map();

export const limitRefreshAccessToken = async (req, res, next) => {
    const { refresh_token } = req.body;
    const now = Date.now();
    const last = refreshMap.get(refresh_token) || 0;
    if (now - last < 5_000) {
        return res.error("REFRESH_TOO_FAST", 429);
    }
    refreshMap.set(refresh_token, now);
    next();
};
