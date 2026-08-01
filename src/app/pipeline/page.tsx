import { getFilterOptions, getPipelineDeals } from "@/lib/queries";
import { updateDealStage } from "@/lib/actions";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  SERVICE_LINE_LABELS,
  LOST_REASON_LABELS,
  formatCompactINR,
} from "@/lib/format";

const STAGE_COLORS: Record<string, string> = {
  QUALIFIED: "border-t-slate-400",
  PROPOSAL: "border-t-blue-400",
  PRESALES: "border-t-indigo-400",
  NEGOTIATION: "border-t-amber-400",
  WON: "border-t-emerald-500",
  LOST: "border-t-rose-400",
};

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string; serviceLine?: string }>;
}) {
  const params = await searchParams;
  const [deals, { users }] = await Promise.all([
    getPipelineDeals({ ownerId: params.ownerId, serviceLine: params.serviceLine }),
    getFilterOptions(),
  ]);

  const columns = STAGE_ORDER.map((stage) => ({
    stage,
    deals: deals.filter((d) => d.stage === stage),
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Pipeline</h1>
        <form className="flex gap-2 text-sm" method="get">
          <select
            name="ownerId"
            defaultValue={params.ownerId ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            <option value="">All owners</option>
            {users
              .filter((u) => u.role === "SALES" || u.role === "ACCOUNT_MANAGER")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <select
            name="serviceLine"
            defaultValue={params.serviceLine ?? ""}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            <option value="">All service lines</option>
            {Object.entries(SERVICE_LINE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
        {columns.map(({ stage, deals: stageDeals }) => (
          <div key={stage} className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-700">
                {STAGE_LABELS[stage]}
              </h2>
              <span className="text-xs text-slate-400">{stageDeals.length}</span>
            </div>
            <div className="space-y-3">
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  className={`rounded-lg border border-slate-200 border-t-4 ${STAGE_COLORS[stage]} bg-white p-3 shadow-sm`}
                >
                  <p className="text-sm font-medium text-slate-900">{deal.accountName}</p>
                  <p className="text-xs text-slate-500">{deal.contactName}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatCompactINR(deal.value)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {SERVICE_LINE_LABELS[deal.serviceLine]}
                  </p>
                  <p className="text-xs text-slate-400">
                    Owner: {deal.salesOwnerName}
                    {deal.presalesOwnerName ? ` · Presales: ${deal.presalesOwnerName}` : ""}
                  </p>
                  {deal.lostReason && (
                    <p className="mt-1 text-xs font-medium text-rose-500">
                      Lost: {LOST_REASON_LABELS[deal.lostReason]}
                    </p>
                  )}
                  <form action={updateDealStage} className="mt-2 flex flex-col gap-1">
                    <input type="hidden" name="dealId" value={deal.id} />
                    <select
                      name="stage"
                      defaultValue={deal.stage}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs"
                    >
                      {STAGE_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <select
                      name="lostReason"
                      defaultValue={deal.lostReason ?? ""}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs"
                    >
                      <option value="">Lost reason (if lost)</option>
                      {Object.entries(LOST_REASON_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-slate-100 px-1.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      Update
                    </button>
                  </form>
                </div>
              ))}
              {stageDeals.length === 0 && (
                <p className="px-1 text-xs text-slate-400">No deals</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
