-- CreateIndex
CREATE INDEX `conversation_deleted_at_idx` ON `conversation`(`deleted_at`);

-- CreateIndex
CREATE INDEX `message_deleted_at_idx` ON `message`(`deleted_at`);
