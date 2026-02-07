const validateChangePassword = ({ password, newPassword, confirmPassword }) => {
    if (!password || password.trim().length === 0) {
        throw new Error("Missing password fields");
    }
    if (![password, newPassword, confirmPassword].every(Boolean)) {
        throw new Error("Missing password fields");
    }

    if (newPassword.trim().length < 6) {
        throw new Error("Mật khẩu phải ít nhất 6 ký tự");
    }

    if (newPassword !== confirmPassword) {
        throw new Error("Mật khẩu mới phải giống nhau");
    }
};

export default validateChangePassword;
