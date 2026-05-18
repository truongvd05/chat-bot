-- AlterTable
ALTER TABLE `conversation` MODIFY `type` ENUM('SELF', 'DIRECT', 'GROUP', 'BOT') NOT NULL DEFAULT 'DIRECT';
