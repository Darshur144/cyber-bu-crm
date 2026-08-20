import Link from "next/link";
import { getRenewalRows } from "@/lib/queries";
import { STAGE_LABELS, formatCompactINR } from "@/lib/format";
import { Badge, Card, PageHeader, StatCard } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "No date";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function RenewalsPage() {
  const rows = await getRenewalRows();
  const open = rows.filter((r) => r.stage !== "WON" && r.stage !== "LOST");
  const value = open.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <PageHeader title="Renewals" subtitle={`${open.length} open renewals in the book`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Open renewals" value={String(open.length)} />
        <StatCard label="Open value" value={formatCompactINR(value)} />
        <StatCard label="All records" value={String(rows.length)} />
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            No renewal-category deals yet. Tag a deal as Renewal on its detail page.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">OEM</th>
                  <th className="px-3 py-2">Expiry</th>
                  <th className="px-3 py-2">Stage</th>
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
                    <td className="figure px-3 py-2.5 text-ink-soft">{formatDate(row.expectedCloseDate)}</td>
                    <td className="px-3 py-2.5">
                      <Badge>{STAGE_LABELS[row.stage] ?? row.stage}</Badge>
                    </td>
                    <td className="figure px-3 py-2.5 text-right">{formatCompactINR(row.value)}</td>
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
