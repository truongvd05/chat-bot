import processEmailJob from "#queues/handle/processEmailJob.js";
import emailService from "#services/email.service.js";
import queueService from "#services/queue.service.js";
import "dotenv/config";

setInterval(async () => {
    try {
        console.log("queue");
        const pendingJobs = await queueService.findOneAndLockPending();
        if (!pendingJobs) return;
        switch (pendingJobs.type) {
            case "sendVerifyEmail":
                console.log("sendVerifyEmail");
                await processEmailJob(
                    pendingJobs,
                    emailService.sendVerifyEmail,
                );
                break;
            case "sendChangePasswordEmail":
                console.log("sendChangePasswordEmail");
                await processEmailJob(
                    pendingJobs,
                    emailService.sendChangePasswordEmail,
                );
                break;
            case "sendPasswordResetToken":
                console.log("sendPasswordResetToken");
                await processEmailJob(
                    pendingJobs,
                    emailService.sendPasswordResetToken,
                );
                break;
            default:
        }
    } catch (err) {
        console.error("Worker error:", err.message);
    }
}, 5000);
