import transporter from "#config/nodemailer.js";

class EmailService {
    async sendVerifyEmail(payload) {
        const url = process.env.FRONTEND_URL || "http://localhost:5173";
        const verifyUrl = `${url}/#/verify-email?token=${payload.token}`;
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || "thanh090800@gmail.com",
            to: payload.email,
            subject: "Xác thực email của bạn",
            html: `<p>Click vào đây để verify email <a href="${verifyUrl} <b>link hết hạn sau 1h</b>" target="_blank">${verifyUrl}</a></p>`,
        });
        console.log("Message sent: %s", info.messageId);
    }
    async sendChangePasswordEmail(payload) {
        const now = new Date().toISOString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
        });
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || "thanh090800@gmail.com",
            to: payload.email,
            subject: "Thông báo đổi mật khẩu",
            html: `<p>Mật khẩu của bạn đã được lúc <b>${now}</b>, nếu bạn là người đổi mật khẩu hãy bỏ qua email này</p>`,
        });
        console.log("Message sent: %s", info.messageId);
    }
    async sendPasswordResetToken(payload) {
        const url = process.env.FRONTEND_URL || "http://localhost:5173";
        const verifyUrl = `${url}/#/reset-password?token=${payload.token}`;
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || "thanh090800@gmail.com",
            to: payload.email,
            subject: "Quên mật khẩu",
            html: `<p>Click vào đây để đổi lại mật khẩu mới <a href="${verifyUrl} <b>link hết hạn sau 15p</b>" target="_blank">${verifyUrl}</a></p>`,
        });
        console.log("Message sent: %s", info.messageId);
    }
}

export default new EmailService();
