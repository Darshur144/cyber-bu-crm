import Link from "next/link";
import { notFound } from "next/navigation";
import { getOemDetail } from "@/lib/queries";
import { STAGE_LABELS, formatCompactINR } from "@/lib/format";
import { Badge, Card, GhostButton, PageHeader, StatCard } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function OemDetailPage({ params }: { params: Promise<{ oem: string }> }) {
  const { oem: raw } = await params;
  const oem = decodeURIComponent(raw);
  const data = await getOemDetail(oem);
  if (!data.dealCount) notFound();

  return (
    <div>
      <div className="mb-4">
        <GhostButton href="/oem">← All OEMs</GhostButton>
      </div>
      <PageHeader title={data.oem} subtitle={`${data.dealCount} deals across ${data.accountCount} accounts`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open deals" value={String(data.openCount)} />
        <StatCard label="Pipeline" value={formatCompactINR(data.openValue)} />
        <StatCard label="Accounts" value={String(data.accountCount)} />
        <StatCard label="All deals" value={String(data.dealCount)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Accounts">
          <ul className="space-y-2 text-sm">
            {data.accounts.map((name) => (
              <li key={name} className="border-b border-line/60 py-1.5 text-ink">
                {name}
              </li>
            ))}
          </ul>
        </Card>
        <div className="lg:col-span-2">
          <Card title="Deals">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-2 py-2">Account</th>
                  <th className="px-2 py-2">Deal</th>
                  <th className="px-2 py-2">Stage</th>
                  <th className="figure px-2 py-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.deals.map((d) => (
                  <tr key={d.id} className="border-b border-line/70">
                    <td className="px-2 py-2">
                      <Link href={`/opportunities/${d.id}`} className="hover:text-accent">
                        {d.accountName}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-ink-soft">{d.title}</td>
                    <td className="px-2 py-2">
                      <Badge>{STAGE_LABELS[d.stage] ?? d.stage}</Badge>
                    </td>
                    <td className="figure px-2 py-2 text-right">{formatCompactINR(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
