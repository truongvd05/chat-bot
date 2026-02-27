import "dotenv/config";
import { QUEUE_STATUS } from "#config/constants.js";
import queueService from "#services/queue.service.js";

const processEmailJob = async (job, handler) => {
    console.log(job);
    try {
        await handler(job.payload);

        await queueService.markSuccess(job.id);
    } catch (err) {
        await queueService.markFailure(job.id, err);
        throw err;
    }
};

export default processEmailJob;
