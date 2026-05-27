import { HTTP_STATUS } from "#config/constants.js";
import prisma from "#libs/prisma.js";
import AppError from "#utils/AppError.js";
import { serializeBigInt } from "#utils/serialize.js";
import { id } from "zod/v4/locales";
import conversationService from "./conversation.service.js";
import { requireVerifiedUser } from "#permissions/user.permission.js";
import { ensureMessageOwner } from "#permissions/message.permission.js";
import { ensureConversationMember } from "#permissions/conversation.permission.js";
import uploadFile from "#utils/uploadFile.js";

class MessageService {
    async deleteMessage(userId, messageId) {
        await ensureMessageOwner(messageId, userId);

        const update = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                deletedAt: new Date(),
            },
        });
        return serializeBigInt(update);
    }
    async editMessage(userId, messageId, conversationId, content) {
        await ensureMessageOwner(messageId, userId);
        const updated = await prisma.message.update({
            where: {
                id: messageId,
            },
            data: {
                content,
                isEdited: true,
                updatedAt: new Date(),
            },
        });

        return serializeBigInt(updated);
    }
    async sendMessage(
        conversationId,
        userId,
        content,
        files = [],
        parentMessageId,
    ) {
        await requireVerifiedUser(userId);
        await ensureConversationMember(conversationId, userId);

        const attachments = await Promise.all(files.map((f) => uploadFile(f)));

        const message = await this._createMessage({
            conversationId,
            userId: userId,
            content,
            parentMessageId,
            attachments,
        });

        return serializeBigInt(message);
    }

    async _createMessage({
        conversationId,
        userId,
        content,
        parentMessageId,
        attachments = [],
    }) {
        return prisma.$transaction(async (tx) => {
            const message = await tx.message.create({
                data: {
                    conversationId,
                    userId,
                    content,
                    role: "user",
                    parentMessageId: parentMessageId ?? null,
                    attachments: {
                        create: attachments,
                    },
                },
                include: {
                    attachments: true,
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    parentMessage: {
                        select: {
                            id: true,
                            content: true,
                            user: { select: { name: true } },
                        },
                    },
                    replies: true,
                },
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessageId: message.id,
                    lastMessageAt: message.createdAt,
                    updatedAt: message.createdAt,
                },
            });

            return serializeBigInt(message);
        });
    }

    async getMessages(userId, conversationId, cursor, limit) {
        await ensureConversationMember(conversationId, userId);
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
                ...(cursor && {
                    id: {
                        lt: BigInt(cursor),
                    },
                }),
            },
            include: {
                parentMessage: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                attachments: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                replies: {
                    where: { deletedAt: null },
                    include: {
                        attachments: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
            take: limit,
        });

        return serializeBigInt(messages.reverse());
    }
}

export default new MessageService();
