/*
  Warnings:

  - You are about to drop the column `user_id` on the `conversation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `conversation_user_id_fkey`;

-- DropIndex
DROP INDEX `conversation_user_id_idx` ON `conversation`;

-- AlterTable
ALTER TABLE `conversation` DROP COLUMN `user_id`,
    MODIFY `type` ENUM('DIRECT', 'GROUP', 'BOT') NOT NULL DEFAULT 'DIRECT';

-- CreateTable
CREATE TABLE `conversation_participant` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `conversationId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    `role` ENUM('MEMBER', 'OWNER', 'BOT') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `left_at` DATETIME(3) NULL,
    `last_read_at` DATETIME(3) NULL,

    UNIQUE INDEX `conversation_participant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conversation_participant` ADD CONSTRAINT `conversation_participant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participant` ADD CONSTRAINT `conversation_participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
