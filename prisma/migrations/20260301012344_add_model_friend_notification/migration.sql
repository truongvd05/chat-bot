-- AlterTable
ALTER TABLE `conversation_participant` ADD COLUMN `unread_count` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `friends` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `requester_id` BIGINT NOT NULL,
    `addressee_id` BIGINT NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `friends_requester_id_idx`(`requester_id`),
    INDEX `friends_addressee_id_idx`(`addressee_id`),
    UNIQUE INDEX `friends_requester_id_addressee_id_key`(`requester_id`, `addressee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `receiverId` BIGINT NOT NULL,
    `senderId` BIGINT NULL,
    `conversationId` BIGINT NULL,
    `messageId` BIGINT NULL,
    `type` ENUM('NEW_MESSAGE', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'ADDED_TO_GROUP') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_receiverId_idx`(`receiverId`),
    INDEX `Notification_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_addressee_id_fkey` FOREIGN KEY (`addressee_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
