-- CreateTable
CREATE TABLE `AngsuranPinkar` (
    `id` VARCHAR(191) NOT NULL,
    `counter` INTEGER NOT NULL,
    `principal` INTEGER NOT NULL,
    `margin` INTEGER NOT NULL,
    `date_pay` DATETIME(3) NOT NULL,
    `date_paid` DATETIME(3) NULL,
    `remaining` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `pinjamanId` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AngsuranPinkar` ADD CONSTRAINT `AngsuranPinkar_pinjamanId_fkey` FOREIGN KEY (`pinjamanId`) REFERENCES `Pinjaman`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
