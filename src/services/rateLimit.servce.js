import rateLimit, { ipKeyGenerator } from "express-rate-limit";

class RateLimit {
    _create({ time, limit, message, keyGenerator }) {
        return rateLimit({
            windowMs: time * 1000,
            max: limit,
            keyGenerator: (req, res) => {
                const key = keyGenerator?.(req, res);
                if (typeof key === "string" && key.length > 0) {
                    return key;
                }
                return ipKeyGenerator(req, res);
            },
            standardHeaders: true,
            legacyHeaders: false,
            message: { message },
        });
    }
    shortMessage() {
        return this._create({
            time: 1,
            limit: 1,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    burstMessage() {
        return this._create({
            time: 10,
            limit: 15,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    longMessage() {
        return this._create({
            time: 5 * 60,
            limit: 100,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    login() {
        return this._create({
            time: 1 * 60,
            limit: 5,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => {
                return req.user?.email?.toLowerCase() || req.ip;
            },
        });
    }
    senVerifyEmailPerMinute() {
        return this._create({
            time: 60 * 60,
            limit: 5,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    senVerifyEmailPerDay() {
        return this._create({
            time: 24 * 60 * 60,
            limit: 5,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    verifyEmailPerMinute() {
        return this._create({
            time: 1,
            limit: 5,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    verifyEmailPreDay() {
        return this._create({
            time: 24 * 60 * 60,
            limit: 20,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    validateEmailPerMinute() {
        return this._create({
            time: 1 * 60,
            limit: 15,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    validateEmailPerHour() {
        return this._create({
            time: 1 * 60 * 60,
            limit: 50,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    validateEmailPerDay() {
        return this._create({
            time: 24 * 60 * 60,
            limit: 100,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    defaultAuthRateLimit() {
        return this._create({
            time: 1 * 60 * 60,
            limit: 5,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    defaultPerMinuteRateLimit() {
        return this._create({
            time: 1 * 60,
            limit: 30,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    defaultEditUserPerMinuteRateLimit() {
        return this._create({
            time: 1 * 60,
            limit: 5,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    defaultEditUserPerDayRateLimit() {
        return this._create({
            time: 1 * 60,
            limit: 50,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
    defaultPerDayRateLimit() {
        return this._create({
            time: 24 * 60 * 60,
            limit: 200,
            message: "Quá nhiều yêu cầu, thử lại sau",
            keyGenerator: (req) => req.user?.email?.toLowerCase() || req.ip,
        });
    }
}

export default new RateLimit();
