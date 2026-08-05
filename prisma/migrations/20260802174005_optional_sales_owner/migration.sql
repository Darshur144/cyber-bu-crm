-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "salesOwnerId" TEXT,
    "presalesOwnerId" TEXT,
    CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_salesOwnerId_fkey" FOREIGN KEY ("salesOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_presalesOwnerId_fkey" FOREIGN KEY ("presalesOwnerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("accountId", "actualCloseDate", "category", "createdAt", "domain", "expectedCloseDate", "externalDealId", "fiscalQuarter", "fiscalYear", "id", "leadId", "lostReason", "oem", "presalesOwnerId", "salesOwnerId", "stage", "title", "updatedAt", "value") SELECT "accountId", "actualCloseDate", "category", "createdAt", "domain", "expectedCloseDate", "externalDealId", "fiscalQuarter", "fiscalYear", "id", "leadId", "lostReason", "oem", "presalesOwnerId", "salesOwnerId", "stage", "title", "updatedAt", "value" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
