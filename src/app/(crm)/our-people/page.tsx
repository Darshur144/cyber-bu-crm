import { getPeopleRows } from "@/lib/queries";
import { ROLE_LABELS, formatCompactINR } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function OurPeoplePage() {
  const rows = await getPeopleRows();

  return (
    <div>
      <PageHeader title="Our People" subtitle={`${rows.length} people in the BU`} />
      <Card>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">No people in the directory yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="figure px-3 py-2 text-right">Leads</th>
                  <th className="figure px-3 py-2 text-right">Open deals</th>
                  <th className="figure px-3 py-2 text-right">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/70">
                    <td className="px-3 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone="neutral">{ROLE_LABELS[row.role] ?? row.role}</Badge>
                    </td>
                    <td className="figure px-3 py-2.5 text-right">{row.leadCount}</td>
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
