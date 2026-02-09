import prisma from "#libs/prisma.js";
import { serializeBigInt } from "#utils/serialize.js";

class BlockService {
    async getAllBlock(userId) {
        const result = await prisma.userBlock.findMany({
            where: {
                blockerId: userId,
            },
            select: {
                id: true,
                createdAt: true,
                blocked: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return serializeBigInt(result);
    }
}

export default new BlockService();
