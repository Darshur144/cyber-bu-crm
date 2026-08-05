import { getDashboardData } from "@/lib/queries";
import { formatINR, formatCompactINR, quarterLabel } from "@/lib/format";
import {
  CategoryMixChart,
  LeadFunnelChart,
  OemMixChart,
  TargetVsActualChart,
} from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  hint,
  tone = "accent",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "accent" | "positive" | "warning";
}) {
  const barColor = tone === "positive" ? "bg-positive" : tone === "warning" ? "bg-warning" : "bg-accent";
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-4 pl-5">
      <div className={`absolute inset-y-0 left-0 w-1 ${barColor}`} />
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="figure mt-1.5 text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="figure mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h2>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const targetTotal = data.targetVsActual.reduce((s, t) => s + t.target, 0);
  const actualTotal = data.targetVsActual.reduce((s, t) => s + t.actual, 0);
  const quarterGrandTotal = data.quarterPivot.reduce((s, q) => s + q.cloudflare + q.other, 0);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">Leadership view</p>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Overall Cybersecurity Pipeline</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Open pipeline value"
          value={formatINR(data.pipelineValue)}
          hint={`${data.openDealCount} open deals`}
        />
        <StatTile
          label="Cloudflare vs Other"
          value={formatCompactINR(data.cloudflarePipeline)}
          hint={`${formatCompactINR(data.otherPipeline)} Other Cybersecurity`}
        />
        <StatTile label="Win rate" value={`${Math.round(data.winRate * 100)}%`} tone="positive" />
        <StatTile
          label="Target vs actual (MTD)"
          value={`${targetTotal > 0 ? Math.round((actualTotal / targetTotal) * 100) : 0}%`}
          hint={`${formatINR(actualTotal)} of ${formatINR(targetTotal)}`}
          tone="warning"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Pipeline value by quarter & domain">
          <div className="overflow-x-auto">
            <table className="figure w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-sans text-ink-soft">
                  <th className="py-1.5 pr-2">Quarter</th>
                  <th className="py-1.5 pr-2 text-right">Cloudflare</th>
                  <th className="py-1.5 pr-2 text-right">Other Cybersecurity</th>
                  <th className="py-1.5 text-right">Overall</th>
                </tr>
              </thead>
              <tbody>
                {data.quarterPivot.map((q) => (
                  <tr key={`${q.year}-${q.quarter}`} className="border-b border-line/60">
                    <td className="py-1.5 pr-2 font-sans font-medium text-ink">{quarterLabel(q.quarter, q.year)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatCompactINR(q.cloudflare)}</td>
                    <td className="py-1.5 pr-2 text-right">{formatCompactINR(q.other)}</td>
                    <td className="py-1.5 text-right font-semibold">{formatCompactINR(q.cloudflare + q.other)}</td>
                  </tr>
                ))}
                <tr className="font-semibold text-ink">
                  <td className="py-1.5 pr-2 font-sans">TOTAL</td>
                  <td className="py-1.5 pr-2 text-right">
                    {formatCompactINR(data.quarterPivot.reduce((s, q) => s + q.cloudflare, 0))}
                  </td>
                  <td className="py-1.5 pr-2 text-right">
                    {formatCompactINR(data.quarterPivot.reduce((s, q) => s + q.other, 0))}
                  </td>
                  <td className="py-1.5 text-right">{formatCompactINR(quarterGrandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {data.dealsWithoutQuarter > 0 && (
            <p className="mt-2 text-xs text-ink-faint">
              {`Excludes ${data.dealsWithoutQuarter} open deal${
                data.dealsWithoutQuarter === 1 ? "" : "s"
              } with no quarter assigned — included in the "Open pipeline value" tile above.`}
            </p>
          )}
        </Card>

        <Card title="Closed / open visibility (all domains)">
          <div className="overflow-x-auto">
            <table className="figure w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-sans text-ink-soft">
                  <th className="py-1.5 pr-2">Status</th>
                  <th className="py-1.5 pr-2 text-right">Deals</th>
                  <th className="py-1.5 pr-2 text-right">Value (INR)</th>
                  <th className="py-1.5 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.statusBreakdown.map((s) => (
                  <tr key={s.status} className="border-b border-line/60">
                    <td className="py-1.5 pr-2 font-sans font-medium text-ink">{s.status}</td>
                    <td className="py-1.5 pr-2 text-right">{s.count}</td>
                    <td className="py-1.5 pr-2 text-right">{formatCompactINR(s.value)}</td>
                    <td className="py-1.5 text-right">{(s.pct * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Open pipeline by category">
          <CategoryMixChart data={data.categoryMix} />
        </Card>
        <Card title="Top OEMs / vendors (open pipeline)">
          <OemMixChart data={data.oemMix} />
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Top opportunities (deals in focus)">
          {data.topOpportunities.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">No opportunities flagged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-soft">
                    <th className="py-1.5 pr-2">Account</th>
                    <th className="py-1.5 pr-2">Type</th>
                    <th className="figure py-1.5 pr-2 text-right">Value</th>
                    <th className="py-1.5">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topOpportunities.map((t) => (
                    <tr key={t.id} className="border-b border-line/60 align-top">
                      <td className="py-1.5 pr-2 font-medium text-ink">{t.accountName}</td>
                      <td className="py-1.5 pr-2 text-ink-soft">{t.dealType ?? "—"}</td>
                      <td className="figure py-1.5 pr-2 text-right">{t.value ? formatCompactINR(t.value) : "—"}</td>
                      <td className="py-1.5 text-xs text-ink-faint">{t.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Recently lost deals">
          {data.recentLostDeals.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">No lost deals.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-soft">
                    <th className="py-1.5 pr-2">Account</th>
                    <th className="figure py-1.5 pr-2 text-right">Value</th>
                    <th className="py-1.5">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLostDeals.map((d, i) => (
                    <tr key={i} className="border-b border-line/60 align-top">
                      <td className="py-1.5 pr-2 font-medium text-ink">{d.accountName}</td>
                      <td className="figure py-1.5 pr-2 text-right text-danger">{formatCompactINR(d.value)}</td>
                      <td className="py-1.5 text-xs text-ink-faint">{d.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Target vs actual by owner (this month)">
          <TargetVsActualChart data={data.targetVsActual} />
        </Card>
        <Card title="Lead funnel">
          <LeadFunnelChart data={data.leadFunnel} />
        </Card>
        <Card title="Install base hunting">
          <div className="flex h-[220px] flex-col items-center justify-center text-center">
            <p className="figure text-3xl font-semibold text-ink">{data.installBaseCount}</p>
            <p className="mt-1 text-sm text-ink-soft">existing accounts flagged for upsell</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
