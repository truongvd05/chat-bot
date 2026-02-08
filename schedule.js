import "dotenv/config";
import cleanupExpiredTokensPassword from "#schedules/cleanupExpiredTokensPassword.js";
import { CronJob } from "cron";

const job = new CronJob(
  "*/5 * * * * *",
  cleanupExpiredTokensPassword,
  null,
  true,
  "Asia/Ho_Chi_Minh",
);
