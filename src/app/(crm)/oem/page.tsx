import Link from "next/link";
import { getOemRows } from "@/lib/queries";
import { formatCompactINR } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function OemPage() {
  const rows = await getOemRows();

  return (
    <div>
      <PageHeader title="OEM" subtitle={`${rows.length} vendors in the book`} />
      <Card>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">No OEM data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2">OEM</th>
                  <th className="figure px-3 py-2 text-right">Open deals</th>
                  <th className="figure px-3 py-2 text-right">Pipeline</th>
                  <th className="figure px-3 py-2 text-right">Won YTD</th>
                  <th className="px-3 py-2">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.oem} className="border-b border-line/70 hover:bg-accent/5">
                    <td className="px-3 py-2.5 font-medium">
                      <Link href={`/oem/${encodeURIComponent(row.oem)}`} className="hover:text-accent">
                        {row.oem}
                      </Link>
                    </td>
                    <td className="figure px-3 py-2.5 text-right">{row.openCount}</td>
                    <td className="figure px-3 py-2.5 text-right">{formatCompactINR(row.openValue)}</td>
                    <td className="figure px-3 py-2.5 text-right">{formatCompactINR(row.wonYtd)}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone="accent2">{Math.round(row.winRate * 100)}%</Badge>
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
