-- CreateTable
CREATE TABLE `Pinjaman` (
    `id` VARCHAR(191) NOT NULL,
    `nip` VARCHAR(191) NOT NULL,
    `fullname` VARCHAR(191) NOT NULL,
    `plafond` INTEGER NOT NULL,
    `tenor` INTEGER NOT NULL,
    `marginRate` DOUBLE NOT NULL,
    `adminRate` DOUBLE NOT NULL,
    `biayaAdmin` INTEGER NOT NULL,
    `terimaBersih` INTEGER NOT NULL,
    `totalMargin` INTEGER NOT NULL,
    `totalBayar` INTEGER NOT NULL,
    `angsuranPerBulan` INTEGER NOT NULL,
    `scheduleJson` LONGTEXT NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
