import rateLimit, { ipKeyGenerator } from "express-rate-limit";

class RateLimit {
  _create({ time, limit, message, keyGenerator }) {
    return rateLimit({
      windowMs: time * 60 * 1000,
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
  message() {
    return this._create({
      time: 1,
      limit: 10,
      message: "Bạn nhắn quá nhanh",
      keyGenerator: (req) => req.body.email?.toLowerCase() || req.ip,
    });
  }
  login() {
    return this._create({
      time: 1,
      limit: 2,
      message: "Đăng nhập quá nhiều lần",
      keyGenerator: (req) => {
        return req.body.email?.toLowerCase() || req.ip;
      },
    });
  }
  senVerifyEmailPerMinute() {
    return this._create({
      time: 1,
      limit: 5,
      message: "Bạn gửi quá nhiều Email",
      keyGenerator: (req) => req.body.email?.toLowerCase() || req.ip,
    });
  }
  senVerifyEmailPerDay() {
    return this._create({
      time: 24 * 60,
      limit: 20,
      message: "Bạn gửi quá nhiều Email",
      keyGenerator: (req) => req.body.email?.toLowerCase() || req.ip,
    });
  }
  verifyEmailPerMinute() {
    return this._create({
      time: 1,
      limit: 5,
      message: "bạn verify quá nhiều",
      keyGenerator: (req) => req.body.email?.toLowerCase() || req.ip,
    });
  }
  verifyEmailPreDay() {
    return this._create({
      time: 24 * 60,
      limit: 20,
      message: "bạn verify quá nhiều trong ngày",
      keyGenerator: (req) => req.body.email?.toLowerCase() || req.ip,
    });
  }
}

export default new RateLimit();
