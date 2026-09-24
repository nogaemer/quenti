/*
  Warnings:

  - A unique constraint covering the columns `[studySetId,externalId]` on the table `Term` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Term` ADD COLUMN `externalId` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Term_studySetId_externalId_key` ON `Term`(`studySetId`, `externalId`);
