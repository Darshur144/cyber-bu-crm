import { getDashboardData } from "@/lib/queries";
import { formatINR } from "@/lib/format";
import {
  LeadFunnelChart,
  LostReasonChart,
  MonthlyClosuresChart,
  ServiceLineMixChart,
  TargetVsActualChart,
} from "@/components/DashboardCharts";

export const dynamic = "force-dynamic";

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const thisMonth = data.monthly[data.monthly.length - 1];
  const targetTotal = data.targetVsActual.reduce((s, t) => s + t.target, 0);
  const actualTotal = data.targetVsActual.reduce((s, t) => s + t.actual, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">BU Dashboard</h1>
          <p className="text-sm text-slate-500">
            Weekly leadership view · last 6 months of activity
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Open pipeline value" value={formatINR(data.pipelineValue)} hint={`${data.openDealCount} open deals`} />
        <StatTile label="Win rate (6 mo)" value={`${Math.round(data.winRate * 100)}%`} />
        <StatTile
          label="Closed this month"
          value={formatINR(thisMonth.wonValue)}
          hint={`${thisMonth.wonCount} won · ${thisMonth.lostCount} lost`}
        />
        <StatTile
          label="Target vs actual (MTD)"
          value={`${targetTotal > 0 ? Math.round((actualTotal / targetTotal) * 100) : 0}%`}
          hint={`${formatINR(actualTotal)} of ${formatINR(targetTotal)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Card title="Month-wise closures (won vs lost)">
            <MonthlyClosuresChart data={data.monthly} />
          </Card>
        </div>
        <Card title="Target vs actual by owner (this month)">
          <TargetVsActualChart data={data.targetVsActual} />
        </Card>
        <Card title="Lead funnel">
          <LeadFunnelChart data={data.leadFunnel} />
        </Card>
        <Card title="Lost deals by reason (6 mo)">
          <LostReasonChart data={data.lostByReason} />
        </Card>
        <Card title="Won revenue by service line (6 mo)">
          <ServiceLineMixChart data={data.serviceLineMix} />
        </Card>
      </div>
    </div>
  );
}
