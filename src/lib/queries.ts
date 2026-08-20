import { prisma } from "@/lib/db";

const OPEN_STAGES = ["QUALIFIED", "PROPOSAL", "PRESALES", "NEGOTIATION"] as const;

export async function getFilterOptions() {
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { users, accounts };
}

export async function getPipelineDeals(filters: { ownerId?: string; oem?: string; category?: string }) {
  const deals = await prisma.deal.findMany({
    where: {
      stage: { in: [...OPEN_STAGES, "WON", "LOST"] },
      ...(filters.ownerId ? { salesOwnerId: filters.ownerId } : {}),
      ...(filters.oem ? { oem: filters.oem } : {}),
      ...(filters.category ? { category: filters.category as never } : {}),
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
    externalDealId: d.externalDealId,
    title: d.title,
    stage: d.stage,
    value: d.value,
    oem: d.oem,
    domain: d.domain,
    category: d.category,
    fiscalQuarter: d.fiscalQuarter,
    fiscalYear: d.fiscalYear,
    sourceStatus: d.sourceStatus,
    lostReason: d.lostReason,
    expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.toISOString() : null,
    accountName: d.account.name,
    contactName: d.lead?.contactName ?? null,
    salesOwnerName: d.salesOwner?.name ?? null,
    presalesOwnerName: d.presalesOwner?.name ?? null,
  }));
}

export async function getDealForEdit(id: string) {
  const [deal, accounts, users] = await Promise.all([
    prisma.deal.findUnique({ where: { id } }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { deal, accounts, users };
}

export async function getUniqueOems() {
  const rows = await prisma.deal.findMany({ distinct: ["oem"], select: { oem: true }, orderBy: { oem: "asc" } });
  return rows.map((r) => r.oem);
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
      include: { lead: true, account: true },
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

  const [allDeals, leads, targets, topOpportunities, installBaseCount] = await Promise.all([
    prisma.deal.findMany({
      select: {
        stage: true,
        value: true,
        oem: true,
        domain: true,
        category: true,
        fiscalQuarter: true,
        fiscalYear: true,
        sourceStatus: true,
        lostReason: true,
        title: true,
        actualCloseDate: true,
        salesOwnerId: true,
        salesOwner: { select: { name: true } },
        account: { select: { name: true } },
        activities: {
          where: { type: "NOTE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { note: true },
        },
      },
    }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.target.findMany({
      where: { periodMonth: months[5].month, periodYear: months[5].year },
      include: { owner: true },
    }),
    prisma.topOpportunity.findMany({ orderBy: { value: "desc" } }),
    prisma.account.count({ where: { isInstallBase: true } }),
  ]);

  const openDeals = allDeals.filter((d) => (OPEN_STAGES as readonly string[]).includes(d.stage));
  const wonDeals = allDeals.filter((d) => d.stage === "WON");
  const lostDeals = allDeals.filter((d) => d.stage === "LOST");

  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const cloudflarePipeline = openDeals.filter((d) => d.domain === "Cloudflare").reduce((s, d) => s + d.value, 0);
  const otherPipeline = pipelineValue - cloudflarePipeline;

  const winRate = wonDeals.length + lostDeals.length > 0 ? wonDeals.length / (wonDeals.length + lostDeals.length) : 0;

  // Quarter x Domain pivot (open pipeline value)
  const quarterMap = new Map<string, { quarter: number; year: number; cloudflare: number; other: number }>();
  let dealsWithoutQuarter = 0;
  for (const d of openDeals) {
    if (!d.fiscalQuarter || !d.fiscalYear) {
      dealsWithoutQuarter++;
      continue;
    }
    const key = `${d.fiscalYear}-${d.fiscalQuarter}`;
    const entry = quarterMap.get(key) ?? { quarter: d.fiscalQuarter, year: d.fiscalYear, cloudflare: 0, other: 0 };
    if (d.domain === "Cloudflare") entry.cloudflare += d.value;
    else entry.other += d.value;
    quarterMap.set(key, entry);
  }
  const quarterPivot = Array.from(quarterMap.values()).sort((a, b) => a.year - b.year || a.quarter - b.quarter);

  // Status breakdown (count/value/% using sourceStatus, falling back to stage-derived label)
  const statusMap = new Map<string, { count: number; value: number }>();
  for (const d of allDeals) {
    const key = d.sourceStatus ?? (d.stage === "WON" ? "Closed - Won" : d.stage === "LOST" ? "Closed - Lost" : "Open");
    const entry = statusMap.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += d.value;
    statusMap.set(key, entry);
  }
  const totalValueAllDeals = allDeals.reduce((s, d) => s + d.value, 0);
  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, v]) => ({ status, ...v, pct: totalValueAllDeals > 0 ? v.value / totalValueAllDeals : 0 }))
    .sort((a, b) => b.value - a.value);

  // Category mix (open pipeline)
  const categoryMap = new Map<string, number>();
  for (const d of openDeals) {
    categoryMap.set(d.category, (categoryMap.get(d.category) ?? 0) + d.value);
  }
  const categoryMix = Array.from(categoryMap.entries()).map(([category, value]) => ({ category, value }));

  // OEM mix (top 8 by open pipeline value)
  const oemMap = new Map<string, number>();
  for (const d of openDeals) {
    oemMap.set(d.oem, (oemMap.get(d.oem) ?? 0) + d.value);
  }
  const oemMix = Array.from(oemMap.entries())
    .map(([oem, value]) => ({ oem, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const recentLostDeals = lostDeals
    .slice(0, 10)
    .map((d) => ({
      title: d.title,
      accountName: d.account.name,
      value: d.value,
      note: d.activities[0]?.note ?? null,
    }));

  const currentMonth = months[5];
  const targetVsActual = targets.map((t) => {
    const actual = wonDeals
      .filter((d) => d.salesOwnerId === t.ownerId)
      .filter((d) => {
        if (!d.actualCloseDate) return false;
        const c = d.actualCloseDate;
        return c.getMonth() + 1 === currentMonth.month && c.getFullYear() === currentMonth.year;
      })
      .reduce((s, d) => s + d.value, 0);
    return { ownerName: t.owner.name, target: t.amount, actual };
  });

  const ytdWon = wonDeals
    .filter((d) => d.actualCloseDate && d.actualCloseDate.getFullYear() === now.getFullYear())
    .reduce((s, d) => s + d.value, 0);
  const targetTotal = targets.reduce((s, t) => s + t.amount, 0);

  return {
    pipelineValue,
    cloudflarePipeline,
    otherPipeline,
    winRate,
    openDealCount: openDeals.length,
    quarterPivot,
    dealsWithoutQuarter,
    statusBreakdown,
    categoryMix,
    oemMix,
    topOpportunities,
    recentLostDeals,
    leadFunnel: leads.map((l) => ({ status: l.status, count: l._count._all })),
    targetVsActual,
    installBaseCount,
    ytdWon,
    targetTotal,
  };
}

function isOpenStage(stage: string) {
  return (OPEN_STAGES as readonly string[]).includes(stage);
}

export async function getOpportunityRows() {
  const deals = await prisma.deal.findMany({
    include: { account: true, salesOwner: true, lead: true },
    orderBy: { updatedAt: "desc" },
  });
  const open = deals.filter((d) => isOpenStage(d.stage));
  const won = deals.filter((d) => d.stage === "WON");
  const now = new Date();
  const wonThisMonth = won.filter((d) => {
    if (!d.actualCloseDate) return false;
    return d.actualCloseDate.getMonth() === now.getMonth() && d.actualCloseDate.getFullYear() === now.getFullYear();
  });
  const openValue = open.reduce((s, d) => s + d.value, 0);
  return {
    stats: {
      openCount: open.length,
      openValue,
      avgValue: open.length ? openValue / open.length : 0,
      wonThisMonthValue: wonThisMonth.reduce((s, d) => s + d.value, 0),
    },
    rows: deals.map((d) => ({
      id: d.id,
      title: d.title,
      accountName: d.account.name,
      oem: d.oem,
      stage: d.stage,
      category: d.category,
      value: d.value,
      ownerName: d.salesOwner?.name ?? null,
      quarter: d.fiscalQuarter,
      year: d.fiscalYear,
    })),
  };
}

export async function getRenewalRows() {
  const deals = await prisma.deal.findMany({
    where: { category: "RENEWAL" },
    include: { account: true, salesOwner: true },
    orderBy: { expectedCloseDate: "asc" },
  });
  return deals.map((d) => ({
    id: d.id,
    title: d.title,
    accountName: d.account.name,
    oem: d.oem,
    stage: d.stage,
    value: d.value,
    ownerName: d.salesOwner?.name ?? null,
    expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.toISOString() : null,
  }));
}

export async function getOemRows() {
  const deals = await prisma.deal.findMany({
    select: { oem: true, stage: true, value: true, actualCloseDate: true },
  });
  const year = new Date().getFullYear();
  const map = new Map<
    string,
    { oem: string; openCount: number; openValue: number; wonYtd: number; wonCount: number; lostCount: number }
  >();
  for (const d of deals) {
    const entry = map.get(d.oem) ?? {
      oem: d.oem,
      openCount: 0,
      openValue: 0,
      wonYtd: 0,
      wonCount: 0,
      lostCount: 0,
    };
    if (isOpenStage(d.stage)) {
      entry.openCount += 1;
      entry.openValue += d.value;
    }
    if (d.stage === "WON") {
      entry.wonCount += 1;
      if (d.actualCloseDate && d.actualCloseDate.getFullYear() === year) entry.wonYtd += d.value;
    }
    if (d.stage === "LOST") entry.lostCount += 1;
    map.set(d.oem, entry);
  }
  return Array.from(map.values())
    .map((e) => ({
      ...e,
      winRate: e.wonCount + e.lostCount > 0 ? e.wonCount / (e.wonCount + e.lostCount) : 0,
    }))
    .sort((a, b) => b.openValue - a.openValue);
}

export async function getOemDetail(oem: string) {
  const deals = await prisma.deal.findMany({
    where: { oem },
    include: { account: true, salesOwner: true },
    orderBy: { updatedAt: "desc" },
  });
  const open = deals.filter((d) => isOpenStage(d.stage));
  const accounts = Array.from(new Set(deals.map((d) => d.account.name)));
  return {
    oem,
    openCount: open.length,
    openValue: open.reduce((s, d) => s + d.value, 0),
    accountCount: accounts.length,
    dealCount: deals.length,
    deals: deals.map((d) => ({
      id: d.id,
      title: d.title,
      accountName: d.account.name,
      stage: d.stage,
      value: d.value,
      ownerName: d.salesOwner?.name ?? null,
    })),
    accounts,
  };
}

export async function getLeadRows() {
  const leads = await prisma.lead.findMany({
    include: { account: true, owner: true },
    orderBy: { createdAt: "desc" },
  });
  const byStatus = new Map<string, number>();
  for (const l of leads) byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
  return {
    stats: {
      total: leads.length,
      newCount: byStatus.get("NEW") ?? 0,
      qualified: byStatus.get("QUALIFIED") ?? 0,
      converted: byStatus.get("CONVERTED") ?? 0,
    },
    rows: leads.map((l) => ({
      id: l.id,
      contactName: l.contactName,
      contactEmail: l.contactEmail,
      accountName: l.account?.name ?? null,
      source: l.source,
      status: l.status,
      ownerName: l.owner.name,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export async function getAccountRows() {
  const accounts = await prisma.account.findMany({
    include: {
      deals: { select: { stage: true, value: true } },
      leads: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
  return accounts.map((a) => {
    const open = a.deals.filter((d) => isOpenStage(d.stage));
    return {
      id: a.id,
      name: a.name,
      industry: a.industry,
      isInstallBase: a.isInstallBase,
      leadCount: a.leads.length,
      openDealCount: open.length,
      pipelineValue: open.reduce((s, d) => s + d.value, 0),
    };
  });
}

export async function getPeopleRows() {
  const users = await prisma.user.findMany({
    include: {
      ownedDeals: { select: { stage: true, value: true } },
      ownedLeads: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });
  return users.map((u) => {
    const open = u.ownedDeals.filter((d) => isOpenStage(d.stage));
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      leadCount: u.ownedLeads.length,
      openDealCount: open.length,
      pipelineValue: open.reduce((s, d) => s + d.value, 0),
    };
  });
}

export async function getDealDetail(id: string) {
  const [deal, accounts, users] = await Promise.all([
    prisma.deal.findUnique({
      where: { id },
      include: {
        account: true,
        lead: true,
        salesOwner: true,
        presalesOwner: true,
        activities: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 12 },
      },
    }),
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { deal, accounts, users };
}
