/*
  Warnings:

  - You are about to drop the column `file_foto` on the `pinjaman` table. All the data in the column will be lost.
  - You are about to drop the column `file_kk` on the `pinjaman` table. All the data in the column will be lost.
  - You are about to drop the column `file_kontrak` on the `pinjaman` table. All the data in the column will be lost.
  - You are about to drop the column `file_ktp` on the `pinjaman` table. All the data in the column will be lost.
  - You are about to drop the column `file_slip_gaji` on the `pinjaman` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `pinjaman` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `pinjaman` DROP COLUMN `file_foto`,
    DROP COLUMN `file_kk`,
    DROP COLUMN `file_kontrak`,
    DROP COLUMN `file_ktp`,
    DROP COLUMN `file_slip_gaji`,
    DROP COLUMN `phone`;
