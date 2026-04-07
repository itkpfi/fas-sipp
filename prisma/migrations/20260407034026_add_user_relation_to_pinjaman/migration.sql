-- AlterTable
ALTER TABLE `pinjaman` ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `nip` VARCHAR(191) NULL,
    MODIFY `fullname` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Pinjaman` ADD CONSTRAINT `Pinjaman_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
