import Link from "next/link";
import { getOpportunityRows } from "@/lib/queries";
import { DEAL_CATEGORY_LABELS, STAGE_LABELS, formatCompactINR, quarterLabel } from "@/lib/format";
import { Badge, Card, GhostButton, PageHeader, StatCard } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const { stats, rows } = await getOpportunityRows();

  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle={`${stats.openCount} open · ${formatCompactINR(stats.openValue)} pipeline`}
        action={<GhostButton href="/pipeline">Board view</GhostButton>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open deals" value={String(stats.openCount)} />
        <StatCard label="Open value" value={formatCompactINR(stats.openValue)} />
        <StatCard label="Avg deal" value={formatCompactINR(stats.avgValue)} />
        <StatCard label="Won this month" value={formatCompactINR(stats.wonThisMonthValue)} />
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">No deals yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Deal</th>
                  <th className="px-3 py-2">OEM</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="figure px-3 py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/70 hover:bg-accent/5">
                    <td className="px-3 py-2.5 font-medium">
                      <Link href={`/opportunities/${row.id}`} className="hover:text-accent">
                        {row.accountName}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{row.title}</td>
                    <td className="px-3 py-2.5">{row.oem}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={row.stage === "LOST" ? "danger" : row.stage === "WON" ? "accent2" : "accent"}>
                        {STAGE_LABELS[row.stage] ?? row.stage}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{DEAL_CATEGORY_LABELS[row.category] ?? row.category}</td>
                    <td className="figure px-3 py-2.5 text-right">
                      {formatCompactINR(row.value)}
                      <span className="ml-2 text-ink-faint">{quarterLabel(row.quarter, row.year)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
