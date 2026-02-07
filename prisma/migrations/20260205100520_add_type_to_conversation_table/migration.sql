/*
  Warnings:

  - Added the required column `userId` to the `message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `conversation` ADD COLUMN `type` ENUM('DIRECT', 'GROUP') NOT NULL DEFAULT 'DIRECT';

-- AlterTable
ALTER TABLE `message` ADD COLUMN `userId` BIGINT NOT NULL;
