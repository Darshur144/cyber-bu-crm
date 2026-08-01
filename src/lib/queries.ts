import { prisma } from "@/lib/db";

const OPEN_STAGES = ["QUALIFIED", "PROPOSAL", "PRESALES", "NEGOTIATION"] as const;

export async function getFilterOptions() {
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { users, accounts };
}

export async function getPipelineDeals(filters: { ownerId?: string; serviceLine?: string }) {
  const deals = await prisma.deal.findMany({
    where: {
      stage: { in: [...OPEN_STAGES, "WON", "LOST"] },
      ...(filters.ownerId ? { salesOwnerId: filters.ownerId } : {}),
      ...(filters.serviceLine ? { serviceLine: filters.serviceLine as never } : {}),
    },
    include: {
      lead: true,
      account: true,
      salesOwner: true,
      presalesOwner: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return deals.map((d) => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    value: d.value,
    serviceLine: d.serviceLine,
    lostReason: d.lostReason,
    expectedCloseDate: d.expectedCloseDate.toISOString(),
    accountName: d.account.name,
    contactName: d.lead.contactName,
    salesOwnerName: d.salesOwner.name,
    presalesOwnerName: d.presalesOwner?.name ?? null,
  }));
}

export async function getQuickEntryData() {
  const [accounts, users, openLeads, openDeals] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: { status: { not: "DISQUALIFIED" } },
      include: { account: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.deal.findMany({
      where: { stage: { in: [...OPEN_STAGES] } },
      include: { lead: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);
  return { accounts, users, openLeads, openDeals };
}

export async function getDashboardData() {
  const now = new Date();
  const months: { month: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  const rangeStart = new Date(months[0].year, months[0].month - 1, 1);

  const [closedDeals, openDeals, allTimeClosedDeals, leads, targets] = await Promise.all([
    prisma.deal.findMany({
      where: {
        stage: { in: ["WON", "LOST"] },
        actualCloseDate: { gte: rangeStart },
      },
      select: {
        stage: true,
        value: true,
        serviceLine: true,
        lostReason: true,
        actualCloseDate: true,
        salesOwnerId: true,
        salesOwner: { select: { name: true } },
      },
    }),
    prisma.deal.findMany({
      where: { stage: { in: [...OPEN_STAGES] } },
      select: { value: true },
    }),
    prisma.deal.findMany({
      where: { stage: { in: ["WON", "LOST"] } },
      select: { stage: true },
    }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.target.findMany({
      where: { periodMonth: months[5].month, periodYear: months[5].year },
      include: { owner: true },
    }),
  ]);

  const monthly = months.map(({ month, year }) => {
    const dealsInMonth = closedDeals.filter((d) => {
      const c = d.actualCloseDate!;
      return c.getMonth() + 1 === month && c.getFullYear() === year;
    });
    const won = dealsInMonth.filter((d) => d.stage === "WON");
    const lost = dealsInMonth.filter((d) => d.stage === "LOST");
    return {
      month,
      year,
      wonValue: won.reduce((s, d) => s + d.value, 0),
      wonCount: won.length,
      lostValue: lost.reduce((s, d) => s + d.value, 0),
      lostCount: lost.length,
    };
  });

  const wonAllTime = allTimeClosedDeals.filter((d) => d.stage === "WON").length;
  const lostAllTime = allTimeClosedDeals.filter((d) => d.stage === "LOST").length;
  const winRate = wonAllTime + lostAllTime > 0 ? wonAllTime / (wonAllTime + lostAllTime) : 0;

  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);

  const lostByReason = new Map<string, { count: number; value: number }>();
  for (const d of closedDeals.filter((d) => d.stage === "LOST")) {
    const key = d.lostReason ?? "OTHER";
    const entry = lostByReason.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += d.value;
    lostByReason.set(key, entry);
  }

  const serviceLineMix = new Map<string, number>();
  for (const d of closedDeals.filter((d) => d.stage === "WON")) {
    serviceLineMix.set(d.serviceLine, (serviceLineMix.get(d.serviceLine) ?? 0) + d.value);
  }

  const currentMonth = months[5];
  const targetVsActual = targets.map((t) => {
    const actual = closedDeals
      .filter((d) => d.stage === "WON" && d.salesOwnerId === t.ownerId)
      .filter((d) => {
        const c = d.actualCloseDate!;
        return c.getMonth() + 1 === currentMonth.month && c.getFullYear() === currentMonth.year;
      })
      .reduce((s, d) => s + d.value, 0);
    return { ownerName: t.owner.name, target: t.amount, actual };
  });

  return {
    monthly,
    winRate,
    pipelineValue,
    lostByReason: Array.from(lostByReason.entries()).map(([reason, v]) => ({ reason, ...v })),
    serviceLineMix: Array.from(serviceLineMix.entries()).map(([serviceLine, value]) => ({
      serviceLine,
      value,
    })),
    leadFunnel: leads.map((l) => ({ status: l.status, count: l._count._all })),
    targetVsActual,
    openDealCount: openDeals.length,
  };
}
