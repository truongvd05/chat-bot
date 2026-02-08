/*
  Warnings:

  - You are about to alter the column `status` on the `queues` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `queues` MODIFY `status` ENUM('pending', 'inprogress', 'completed', 'failed') NOT NULL DEFAULT 'pending';
