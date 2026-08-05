// Imports the real pipeline data (transformed from the user's Excel trackers
// into a clean JSON file) into whichever DB DATABASE_URL points at.
// Usage: npx tsx prisma/import-real-pipeline.ts <path-to-import_ready.json>
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { readFileSync } from "node:fs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

type ImportedDeal = {
  externalDealId: string | null;
  title: string;
  accountName: string;
  oem: string;
  domain: string;
  category: string;
  fiscalQuarter: number | null;
  fiscalYear: number | null;
  stage: string;
  value: number;
  expectedCloseDate: string | null;
  lostReason: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  source: string | null;
  rawStageText: string | null;
  rawStatusText: string | null;
  remarkNote: string | null;
};

type ImportFile = {
  deals: ImportedDeal[];
  topOpportunities: { accountName: string; dealType: string | null; value: number | null; note: string | null }[];
  installBase: { accountName: string; note: string | null }[];
};

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: tsx prisma/import-real-pipeline.ts <import_ready.json>");
  const data: ImportFile = JSON.parse(readFileSync(path, "utf-8"));

  console.log(`Importing ${data.deals.length} deals, ${data.topOpportunities.length} top opportunities, ${data.installBase.length} install-base accounts...`);

  const userCache = new Map<string, string>(); // name -> id
  async function getOrCreateUser(name: string | null, email: string | null): Promise<string | null> {
    if (!name) return null;
    if (userCache.has(name)) return userCache.get(name)!;
    const existing = await prisma.user.findFirst({ where: { name } });
    if (existing) {
      userCache.set(name, existing.id);
      return existing.id;
    }
    const role = name === "Darshan R" ? "BU_HEAD" : "SALES";
    const created = await prisma.user.create({ data: { name, role: role as never } });
    userCache.set(name, created.id);
    return created.id;
  }

  const accountCache = new Map<string, string>(); // name -> id
  async function getOrCreateAccount(name: string): Promise<string> {
    if (accountCache.has(name)) return accountCache.get(name)!;
    const existing = await prisma.account.findFirst({ where: { name } });
    if (existing) {
      accountCache.set(name, existing.id);
      return existing.id;
    }
    const created = await prisma.account.create({ data: { name } });
    accountCache.set(name, created.id);
    return created.id;
  }

  let created = 0;
  for (const d of data.deals) {
    const accountId = await getOrCreateAccount(d.accountName);
    const salesOwnerId = await getOrCreateUser(d.ownerName, d.ownerEmail);

    const deal = await prisma.deal.create({
      data: {
        externalDealId: d.externalDealId,
        title: d.title,
        oem: d.oem,
        domain: d.domain,
        category: d.category as never,
        fiscalQuarter: d.fiscalQuarter,
        fiscalYear: d.fiscalYear,
        stage: d.stage as never,
        sourceStatus: d.rawStatusText,
        value: d.value,
        expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate) : null,
        actualCloseDate:
          (d.stage === "WON" || d.stage === "LOST") && d.expectedCloseDate ? new Date(d.expectedCloseDate) : null,
        lostReason: d.lostReason as never,
        accountId,
        salesOwnerId,
      },
    });

    const noteParts: string[] = [];
    if (d.remarkNote) noteParts.push(d.remarkNote);
    noteParts.push(`Imported from Excel — original stage: "${d.rawStageText ?? "n/a"}", status: "${d.rawStatusText ?? "n/a"}", source: ${d.source ?? "n/a"}.`);
    await prisma.activity.create({
      data: {
        type: "NOTE",
        note: noteParts.join(" "),
        userId: salesOwnerId,
        dealId: deal.id,
      },
    });

    created++;
  }
  console.log(`Created ${created} deals.`);

  for (const t of data.topOpportunities) {
    await prisma.topOpportunity.create({
      data: {
        accountName: t.accountName,
        dealType: t.dealType,
        value: t.value,
        note: t.note,
      },
    });
  }
  console.log(`Created ${data.topOpportunities.length} top opportunities.`);

  for (const ib of data.installBase) {
    const accountId = await getOrCreateAccount(ib.accountName);
    await prisma.account.update({
      where: { id: accountId },
      data: { isInstallBase: true, installBaseNote: ib.note },
    });
  }
  console.log(`Marked ${data.installBase.length} install-base accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
