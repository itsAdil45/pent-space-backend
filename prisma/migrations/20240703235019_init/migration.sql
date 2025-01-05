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
ALTER TABLE `notifications` MODIFY `sender_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `date_of_birth` DATETIME NULL;
