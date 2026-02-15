/*
  Warnings:

  - You are about to drop the column `confidenceScore` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `OAuthAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OAuthAccount" DROP CONSTRAINT "OAuthAccount_userId_fkey";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "confidenceScore";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "region";

-- DropTable
DROP TABLE "OAuthAccount";
