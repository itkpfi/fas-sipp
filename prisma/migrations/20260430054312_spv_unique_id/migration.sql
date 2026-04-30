/*
  Warnings:

  - A unique constraint covering the columns `[spvId]` on the table `SPVRelation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `SPVRelation_spvId_key` ON `SPVRelation`(`spvId`);
