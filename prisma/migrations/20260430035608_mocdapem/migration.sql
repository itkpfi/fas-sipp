/*
  Warnings:

  - You are about to drop the column `userId` on the `dapem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `dapem` DROP FOREIGN KEY `Dapem_userId_fkey`;

-- DropIndex
DROP INDEX `Dapem_userId_fkey` ON `dapem`;

-- AlterTable
ALTER TABLE `dapem` DROP COLUMN `userId`;
