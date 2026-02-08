import authService from "#services/auth.service.js";

async function cleanupExpiredTokensPassword() {
  try {
    const result = await authService.deleteExpiredPassword();
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}

export default cleanupExpiredTokensPassword;
