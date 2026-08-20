import { getDashboardData } from "@/lib/queries";
import { formatINR, formatCompactINR, quarterLabel } from "@/lib/format";
import {
  CategoryMixChart,
  LeadFunnelChart,
  OemMixChart,
  TargetVsActualChart,
} from "@/components/DashboardCharts";
import { Card, IconStat, PageHeader, StatCard } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboardPage() {
  const data = await getDashboardData();
  const targetTotal = data.targetVsActual.reduce((s, t) => s + t.target, 0);
  const actualTotal = data.targetVsActual.reduce((s, t) => s + t.actual, 0);
  const quarterGrandTotal = data.quarterPivot.reduce((s, q) => s + q.cloudflare + q.other, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Leadership view"
        title="Executive Dashboard"
        subtitle={
          <>
            Weekly BU view · <span className="figure font-semibold text-accent">{formatCompactINR(data.pipelineValue)} pipeline</span>
          </>
        }
      />

      <div className="mb-8 flex flex-wrap gap-8">
        <IconStat label="Target" value={formatCompactINR(data.targetTotal)} tone="accent2" />
        <IconStat label="YTD" value={formatCompactINR(data.ytdWon)} />
        <IconStat label="Margin" value="—" />
        <IconStat label="Pipeline" value={formatCompactINR(data.pipelineValue)} tone="accent2" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Open deals" value={String(data.openDealCount)} />
        <StatCard label="Win rate" value={`${Math.round(data.winRate * 100)}%`} />
        <StatCard label="Cloudflare" value={formatCompactINR(data.cloudflarePipeline)} />
        <StatCard label="Other cyber" value={formatCompactINR(data.otherPipeline)} />
        <StatCard
          label="Target vs actual"
          value={`${targetTotal > 0 ? Math.round((actualTotal / targetTotal) * 100) : 0}%`}
          hint={`${formatCompactINR(actualTotal)} of ${formatCompactINR(targetTotal)}`}
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
              } with no quarter assigned.`}
            </p>
          )}
        </Card>

        <Card title="Closed / open visibility">
          <div className="overflow-x-auto">
            <table className="figure w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-sans text-ink-soft">
                  <th className="py-1.5 pr-2">Status</th>
                  <th className="py-1.5 pr-2 text-right">Deals</th>
                  <th className="py-1.5 pr-2 text-right">Value</th>
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
        <Card title="Top OEMs / vendors">
          <OemMixChart data={data.oemMix} />
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Top opportunities">
          {data.topOpportunities.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">No opportunities flagged.</p>
          ) : (
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
          )}
        </Card>

        <Card title="Recently lost deals">
          {data.recentLostDeals.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">No lost deals.</p>
          ) : (
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
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Target vs actual by owner">
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
