/*
  Warnings:

  - Added the required column `c_bpp` to the `Dapem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `c_infomation` to the `Dapem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `c_information` to the `Sumdan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dapem` ADD COLUMN `c_bpp` INTEGER NOT NULL,
    ADD COLUMN `c_infomation` INTEGER NOT NULL,
    ADD COLUMN `file_proses` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sumdan` ADD COLUMN `c_information` INTEGER NOT NULL,
    ADD COLUMN `pic1` VARCHAR(191) NULL,
    ADD COLUMN `pic2` VARCHAR(191) NULL;
