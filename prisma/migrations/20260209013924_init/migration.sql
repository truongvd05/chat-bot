-- DropForeignKey
ALTER TABLE `conversation` DROP FOREIGN KEY `conversation_ownerId_fkey`;

-- AlterTable
ALTER TABLE `conversation` MODIFY `ownerId` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
