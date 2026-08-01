import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:C:/Users/DarshanR/cyber-bu-crm/dev.db" });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  await prisma.activity.deleteMany();
  await prisma.target.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const [buHead, engHead, presales1, presales2, sales1, sales2, am1, am2] =
    await Promise.all([
      prisma.user.create({ data: { name: "Darshan R", role: "BU_HEAD" } }),
      prisma.user.create({ data: { name: "Rakesh Sharma", role: "ENGINEERING_HEAD" } }),
      prisma.user.create({ data: { name: "Priya Nair", role: "PRESALES" } }),
      prisma.user.create({ data: { name: "Amit Verma", role: "PRESALES" } }),
      prisma.user.create({ data: { name: "Sanjay Iyer", role: "SALES" } }),
      prisma.user.create({ data: { name: "Neha Kapoor", role: "SALES" } }),
      prisma.user.create({ data: { name: "Vikram Rao", role: "ACCOUNT_MANAGER" } }),
      prisma.user.create({ data: { name: "Meera Joshi", role: "ACCOUNT_MANAGER" } }),
    ]);

  const accountNames = [
    ["FinCore Bank", "BFSI"],
    ["Aarav Retail Ltd", "Retail"],
    ["NimbusHealth", "Healthcare"],
    ["Skyline Logistics", "Logistics"],
    ["Prime Manufacturing", "Manufacturing"],
    ["Zenith Insurance", "Insurance"],
  ] as const;

  const accounts = await Promise.all(
    accountNames.map(([name, industry]) =>
      prisma.account.create({ data: { name, industry } })
    )
  );

  const serviceLines = ["VAPT", "SOC", "GRC_COMPLIANCE", "ADVISORY", "MANAGED_SECURITY"] as const;
  const sources = ["INBOUND", "OUTBOUND", "REFERRAL", "EVENT", "PARTNER"] as const;
  const salesOwners = [sales1, sales2];
  const presalesOwners = [presales1, presales2];

  function pick<T>(arr: readonly T[], i: number): T {
    return arr[i % arr.length];
  }

  const leadSeeds = [
    { contact: "Rohan Mehta", account: 0, ageDays: 170, status: "CONVERTED" },
    { contact: "Sunita Desai", account: 1, ageDays: 160, status: "CONVERTED" },
    { contact: "Karan Malhotra", account: 2, ageDays: 150, status: "CONVERTED" },
    { contact: "Divya Pillai", account: 3, ageDays: 140, status: "CONVERTED" },
    { contact: "Arjun Bose", account: 4, ageDays: 130, status: "CONVERTED" },
    { contact: "Kavita Menon", account: 5, ageDays: 120, status: "CONVERTED" },
    { contact: "Rahul Chawla", account: 0, ageDays: 100, status: "CONVERTED" },
    { contact: "Anjali Kulkarni", account: 1, ageDays: 90, status: "CONVERTED" },
    { contact: "Vivek Shetty", account: 2, ageDays: 75, status: "CONVERTED" },
    { contact: "Pooja Reddy", account: 3, ageDays: 60, status: "CONVERTED" },
    { contact: "Manish Agarwal", account: 4, ageDays: 45, status: "CONVERTED" },
    { contact: "Ritu Saxena", account: 5, ageDays: 35, status: "CONVERTED" },
    { contact: "Deepak Choudhary", account: 0, ageDays: 20, status: "QUALIFIED" },
    { contact: "Shreya Bhat", account: 1, ageDays: 15, status: "QUALIFIED" },
    { contact: "Nikhil Rana", account: 2, ageDays: 8, status: "CONTACTED" },
    { contact: "Alok Tiwari", account: 5, ageDays: 5, status: "NEW" },
    { contact: "Farah Khan", account: 3, ageDays: 25, status: "DISQUALIFIED" },
  ] as const;

  const leads = [];
  for (let i = 0; i < leadSeeds.length; i++) {
    const s = leadSeeds[i];
    const lead = await prisma.lead.create({
      data: {
        contactName: s.contact,
        contactEmail: s.contact.toLowerCase().replace(" ", ".") + "@example.com",
        source: pick(sources, i),
        serviceLine: pick(serviceLines, i),
        status: s.status,
        createdAt: daysAgo(s.ageDays),
        accountId: accounts[s.account].id,
        ownerId: pick(salesOwners, i).id,
      },
    });
    leads.push(lead);
  }

  const dealSeeds = [
    { lead: 0, stage: "WON", value: 1850000, closeDays: 165, service: "VAPT" },
    { lead: 1, stage: "WON", value: 2400000, closeDays: 152, service: "SOC" },
    { lead: 2, stage: "LOST", value: 900000, closeDays: 140, lost: "PRICE", service: "GRC_COMPLIANCE" },
    { lead: 3, stage: "WON", value: 3200000, closeDays: 128, service: "MANAGED_SECURITY" },
    { lead: 4, stage: "LOST", value: 1200000, closeDays: 118, lost: "COMPETITOR", service: "VAPT" },
    { lead: 5, stage: "WON", value: 1650000, closeDays: 105, service: "ADVISORY" },
    { lead: 6, stage: "WON", value: 2100000, closeDays: 88, service: "SOC" },
    { lead: 7, stage: "LOST", value: 750000, closeDays: 72, lost: "TIMING", service: "VAPT" },
    { lead: 8, stage: "WON", value: 2950000, closeDays: 58, service: "MANAGED_SECURITY" },
    { lead: 9, stage: "WON", value: 1400000, closeDays: 40, service: "GRC_COMPLIANCE" },
    { lead: 10, stage: "LOST", value: 1100000, closeDays: 28, lost: "NO_BUDGET", service: "ADVISORY" },
    { lead: 11, stage: "WON", value: 1980000, closeDays: 12, service: "VAPT" },
    { lead: 12, stage: "NEGOTIATION", value: 2600000, closeDays: -20, service: "SOC" },
    { lead: 13, stage: "PROPOSAL", value: 1750000, closeDays: -35, service: "VAPT" },
  ] as const;

  for (let i = 0; i < dealSeeds.length; i++) {
    const s = dealSeeds[i];
    const lead = leads[s.lead];
    const isClosed = s.stage === "WON" || s.stage === "LOST";
    await prisma.deal.create({
      data: {
        title: `${s.service.replace("_", " ")} engagement - ${lead.contactName}`,
        stage: s.stage,
        value: s.value,
        serviceLine: s.service,
        expectedCloseDate: daysAgo(s.closeDays),
        actualCloseDate: isClosed ? daysAgo(s.closeDays) : null,
        lostReason: "lost" in s ? s.lost : null,
        createdAt: daysAgo(s.closeDays + 25),
        leadId: lead.id,
        accountId: lead.accountId!,
        salesOwnerId: lead.ownerId,
        presalesOwnerId: pick(presalesOwners, i).id,
      },
    });
  }

  const activityTypes = ["CALL", "MEETING", "EMAIL", "PROPOSAL_SENT", "FOLLOW_UP", "NOTE"] as const;
  const notes = [
    "Initial discovery call, discussed scope and timeline.",
    "Sent technical proposal for review.",
    "Client requested revised pricing.",
    "Follow-up call, awaiting internal sign-off.",
    "Kickoff meeting scheduled with delivery team.",
    "Contract under legal review.",
  ];
  for (let i = 0; i < 24; i++) {
    const lead = leads[i % leads.length];
    await prisma.activity.create({
      data: {
        type: pick(activityTypes, i),
        note: pick(notes, i),
        createdAt: daysAgo((i * 7) % 170),
        leadId: lead.id,
        userId: pick(salesOwners, i).id,
      },
    });
  }

  const now = new Date();
  for (const owner of salesOwners) {
    for (let m = 0; m < 4; m++) {
      const month = now.getMonth() - m;
      const year = now.getFullYear() + Math.floor(month / 12);
      const normalizedMonth = ((month % 12) + 12) % 12;
      await prisma.target.create({
        data: {
          ownerId: owner.id,
          periodMonth: normalizedMonth + 1,
          periodYear: year,
          amount: 2000000,
        },
      });
    }
  }

  console.log("Seed complete:", {
    users: 8,
    accounts: accounts.length,
    leads: leads.length,
    deals: dealSeeds.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
