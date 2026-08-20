import { getAccountRows } from "@/lib/queries";
import { formatCompactINR } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const rows = await getAccountRows();

  return (
    <div>
      <PageHeader title="Accounts" subtitle={`${rows.length} accounts`} />
      <Card>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Industry</th>
                  <th className="px-3 py-2">Install base</th>
                  <th className="figure px-3 py-2 text-right">Open deals</th>
                  <th className="figure px-3 py-2 text-right">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/70">
                    <td className="px-3 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{row.industry ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {row.isInstallBase ? <Badge tone="accent2">Install base</Badge> : <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="figure px-3 py-2.5 text-right">{row.openDealCount}</td>
                    <td className="figure px-3 py-2.5 text-right">{formatCompactINR(row.pipelineValue)}</td>
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
