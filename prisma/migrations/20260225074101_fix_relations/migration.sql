-- AlterTable
ALTER TABLE `conversation` ADD COLUMN `lastMessageId` BIGINT NULL;

-- AlterTable
ALTER TABLE `conversation_participant` MODIFY `role` ENUM('MEMBER', 'OWNER', 'ADMIN', 'BOT') NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE `message` MODIFY `role` ENUM('user', 'bot') NULL;

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_lastMessageId_fkey` FOREIGN KEY (`lastMessageId`) REFERENCES `message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
