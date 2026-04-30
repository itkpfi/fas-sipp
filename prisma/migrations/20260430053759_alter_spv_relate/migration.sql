/*
  Warnings:

  - You are about to drop the column `userId` on the `spvrelation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `spvrelation` DROP FOREIGN KEY `SPVRelation_userId_fkey`;

-- DropIndex
DROP INDEX `SPVRelation_userId_fkey` ON `spvrelation`;

-- AlterTable
ALTER TABLE `spvrelation` DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `sPVRelationId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_sPVRelationId_fkey` FOREIGN KEY (`sPVRelationId`) REFERENCES `SPVRelation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
