/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `systemPrompt` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `update_at` on the `conversation` table. All the data in the column will be lost.
  - You are about to drop the column `conversationId` on the `conversation_participant` table. All the data in the column will be lost.
  - You are about to drop the column `joinedAt` on the `conversation_participant` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `conversation_participant` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `update_at` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `isRevoke` on the `refresh_token` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiresAt` on the `refresh_token` table. All the data in the column will be lost.
  - You are about to drop the column `update_at` on the `refresh_token` table. All the data in the column will be lost.
  - You are about to drop the column `activeConversationId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `update_at` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversation_id,user_id]` on the table `conversation_participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `conversation_id` to the `conversation_participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `conversation_participant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_expires_at` to the `refresh_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `refresh_token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `conversation_participant` DROP FOREIGN KEY `conversation_participant_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `conversation_participant` DROP FOREIGN KEY `conversation_participant_userId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `message_conversation_id_fkey`;

-- DropForeignKey
ALTER TABLE `refresh_token` DROP FOREIGN KEY `refresh_token_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_activeConversationId_fkey`;

-- DropIndex
DROP INDEX `conversation_participant_conversationId_userId_key` ON `conversation_participant`;

-- DropIndex
DROP INDEX `conversation_participant_userId_fkey` ON `conversation_participant`;

-- DropIndex
DROP INDEX `users_activeConversationId_fkey` ON `users`;

-- AlterTable
ALTER TABLE `conversation` DROP COLUMN `deletedAt`,
    DROP COLUMN `systemPrompt`,
    DROP COLUMN `update_at`,
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `system_prompt` TEXT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `conversation_participant` DROP COLUMN `conversationId`,
    DROP COLUMN `joinedAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `conversation_id` BIGINT NOT NULL,
    ADD COLUMN `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `user_id` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `deletedAt`,
    DROP COLUMN `update_at`,
    DROP COLUMN `userId`,
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `is_edited` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` BIGINT NULL;

-- AlterTable
ALTER TABLE `refresh_token` DROP COLUMN `isRevoke`,
    DROP COLUMN `tokenExpiresAt`,
    DROP COLUMN `update_at`,
    ADD COLUMN `is_revoked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `token_expires_at` DATETIME(3) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `activeConversationId`,
    DROP COLUMN `update_at`,
    ADD COLUMN `active_conversation_id` BIGINT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `conversation_participant_user_id_idx` ON `conversation_participant`(`user_id`);

-- CreateIndex
CREATE INDEX `conversation_participant_conversation_id_idx` ON `conversation_participant`(`conversation_id`);

-- CreateIndex
CREATE UNIQUE INDEX `conversation_participant_conversation_id_user_id_key` ON `conversation_participant`(`conversation_id`, `user_id`);

-- CreateIndex
CREATE INDEX `message_user_id_idx` ON `message`(`user_id`);

-- CreateIndex
CREATE INDEX `refresh_token_token_expires_at_idx` ON `refresh_token`(`token_expires_at`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_active_conversation_id_fkey` FOREIGN KEY (`active_conversation_id`) REFERENCES `conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_token` ADD CONSTRAINT `refresh_token_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participant` ADD CONSTRAINT `conversation_participant_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversation_participant` ADD CONSTRAINT `conversation_participant_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `refresh_token` RENAME INDEX `refresh_token_user_id_fkey` TO `refresh_token_user_id_idx`;
