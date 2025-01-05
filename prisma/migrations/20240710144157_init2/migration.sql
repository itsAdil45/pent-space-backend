/*
  Warnings:

  - You are about to alter the column `date_of_birth` on the `crowd_fundings` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `end_datetime` on the `crowd_fundings` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `date_of_birth` on the `users` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `crowd_fundings` MODIFY `date_of_birth` DATETIME NULL,
    MODIFY `end_datetime` DATETIME NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `date_of_birth` DATETIME NULL;

-- CreateTable
CREATE TABLE `block_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blocked_user_id` INTEGER NOT NULL,
    `blocked_by_id` INTEGER NOT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `block_user` ADD CONSTRAINT `block_user_blocked_user_id_fkey` FOREIGN KEY (`blocked_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `block_user` ADD CONSTRAINT `block_user_blocked_by_id_fkey` FOREIGN KEY (`blocked_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
