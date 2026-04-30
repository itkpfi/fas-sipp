-- AlterTable
ALTER TABLE `dapem` ADD COLUMN `agentFrontingId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `agentFrontingId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AgentFronting` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `up` VARCHAR(191) NOT NULL,
    `file` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SumdanAgentFronting` (
    `id` VARCHAR(191) NOT NULL,
    `agentFrontingId` VARCHAR(191) NOT NULL,
    `sumdanId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_agentFrontingId_fkey` FOREIGN KEY (`agentFrontingId`) REFERENCES `AgentFronting`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dapem` ADD CONSTRAINT `Dapem_agentFrontingId_fkey` FOREIGN KEY (`agentFrontingId`) REFERENCES `AgentFronting`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SumdanAgentFronting` ADD CONSTRAINT `SumdanAgentFronting_sumdanId_fkey` FOREIGN KEY (`sumdanId`) REFERENCES `Sumdan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SumdanAgentFronting` ADD CONSTRAINT `SumdanAgentFronting_agentFrontingId_fkey` FOREIGN KEY (`agentFrontingId`) REFERENCES `AgentFronting`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
