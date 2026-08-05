/*
  Warnings:

  - You are about to drop the column `serviceLine` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `serviceLine` on the `Lead` table. All the data in the column will be lost.
  - Added the required column `domain` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oem` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TopOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountName" TEXT NOT NULL,
    "dealType" TEXT,
    "value" REAL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "isInstallBase" BOOLEAN NOT NULL DEFAULT false,
    "installBaseNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Account" ("createdAt", "id", "industry", "name") SELECT "createdAt", "id", "industry", "name" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalDealId" TEXT,
    "title" TEXT NOT NULL,
    "oem" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'NEW_BUSINESS',
    "fiscalQuarter" INTEGER,
    "fiscalYear" INTEGER,
    "stage" TEXT NOT NULL DEFAULT 'QUALIFIED',
    "value" REAL NOT NULL,
    "expectedCloseDate" DATETIME,
    "actualCloseDate" DATETIME,
    "lostReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "leadId" TEXT,
    "accountId" TEXT NOT NULL,
    "salesOwnerId" TEXT NOT NULL,
    "presalesOwnerId" TEXT,
    CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_salesOwnerId_fkey" FOREIGN KEY ("salesOwnerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_presalesOwnerId_fkey" FOREIGN KEY ("presalesOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("accountId", "actualCloseDate", "createdAt", "expectedCloseDate", "id", "leadId", "lostReason", "presalesOwnerId", "salesOwnerId", "stage", "title", "updatedAt", "value") SELECT "accountId", "actualCloseDate", "createdAt", "expectedCloseDate", "id", "leadId", "lostReason", "presalesOwnerId", "salesOwnerId", "stage", "title", "updatedAt", "value" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Lead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("accountId", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "ownerId", "source", "status") SELECT "accountId", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "ownerId", "source", "status" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
