/*
  Warnings:

  - You are about to drop the column `isActive` on the `conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `conversation` DROP COLUMN `isActive`,
    ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `activeConversationId` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_activeConversationId_fkey` FOREIGN KEY (`activeConversationId`) REFERENCES `conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
