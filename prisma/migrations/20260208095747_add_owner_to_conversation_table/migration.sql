/*
  Warnings:

  - Added the required column `ownerId` to the `conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `conversation` ADD COLUMN `ownerId` BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX `conversation_ownerId_idx` ON `conversation`(`ownerId`);

-- AddForeignKey
ALTER TABLE `conversation` ADD CONSTRAINT `conversation_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
