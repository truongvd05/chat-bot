import prisma from "#libs/prisma.js";
import { QUEUE_STATUS } from "../config/constants.js";

class QueueService {
    async push(type, payload) {
        const result = await prisma.queues.create({
            data: {
                type,
                payload,
            },
        });
        return result;
    }
    async findOneAndLockPending() {
        return prisma.$transaction(async (tx) => {
            const job = await tx.queues.findFirst({
                where: { status: QUEUE_STATUS.PENDING },
                orderBy: { createdAt: "asc" },
            });

            if (!job) return null;

            await tx.queues.update({
                where: { id: job.id },
                data: { status: QUEUE_STATUS.INPROGRESS },
            });

            return job;
        });
    }
    async markSuccess(id) {
        return prisma.queues.update({
            where: { id },
            data: { status: QUEUE_STATUS.COMPLETED },
        });
    }
    async markFailure(job, error) {
        const attempts = job.attempts + 1;

        return prisma.queues.update({
            where: { id: job.id },
            data: {
                attempts,
                lastError: error.message,
                status:
                    attempts >= job.maxAttempt
                        ? QUEUE_STATUS.FAILED
                        : QUEUE_STATUS.PENDING,
            },
        });
    }
}

export default new QueueService();
