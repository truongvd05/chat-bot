/*
  Warnings:

  - The values [BOT] on the enum `conversation_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [BOT] on the enum `conversation_participant_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `active_conversation_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_active_conversation_id_fkey`;

-- DropIndex
DROP INDEX `users_active_conversation_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `conversation` MODIFY `type` ENUM('SELF', 'DIRECT', 'GROUP') NOT NULL DEFAULT 'DIRECT';

-- AlterTable
ALTER TABLE `conversation_participant` MODIFY `role` ENUM('MEMBER', 'OWNER', 'ADMIN') NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE `users` DROP COLUMN `active_conversation_id`;
