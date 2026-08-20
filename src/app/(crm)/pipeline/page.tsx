import Link from "next/link";
import { getFilterOptions, getPipelineDeals, getUniqueOems } from "@/lib/queries";
import { updateDealStage } from "@/lib/actions";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  DEAL_CATEGORY_LABELS,
  DEAL_CATEGORY_ORDER,
  LOST_REASON_LABELS,
  formatCompactINR,
  quarterLabel,
} from "@/lib/format";
import { GhostButton, PageHeader } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

const STAGE_COLORS: Record<string, string> = {
  QUALIFIED: "border-t-ink-faint",
  PROPOSAL: "border-t-accent",
  PRESALES: "border-t-indigo-400",
  NEGOTIATION: "border-t-warning",
  WON: "border-t-positive",
  LOST: "border-t-danger",
};

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ ownerId?: string; oem?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [deals, { users }, oems] = await Promise.all([
    getPipelineDeals({ ownerId: params.ownerId, oem: params.oem, category: params.category }),
    getFilterOptions(),
    getUniqueOems(),
  ]);

  const columns = STAGE_ORDER.map((stage) => ({
    stage,
    deals: deals.filter((d) => d.stage === stage),
  }));

  return (
    <div>
      <PageHeader
        title="Pipeline board"
        subtitle="Stage columns for the same deals as Opportunities"
        action={<GhostButton href="/opportunities">Table view</GhostButton>}
      />

      <div className="mb-6 flex items-center justify-end">
        <form className="flex gap-2 text-sm" method="get">
          <select
            name="ownerId"
            defaultValue={params.ownerId ?? ""}
            className="rounded-md border border-line bg-surface px-2 py-1"
          >
            <option value="">All owners</option>
            {users
              .filter((u) => u.role === "SALES" || u.role === "ACCOUNT_MANAGER" || u.role === "BU_HEAD")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <select
            name="oem"
            defaultValue={params.oem ?? ""}
            className="rounded-md border border-line bg-surface px-2 py-1"
          >
            <option value="">All OEMs</option>
            {oems.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={params.category ?? ""}
            className="rounded-md border border-line bg-surface px-2 py-1"
          >
            <option value="">All categories</option>
            {DEAL_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {DEAL_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-accent px-3 py-1 text-sm font-semibold text-[#1a1002] hover:brightness-110"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
        {columns.map(({ stage, deals: stageDeals }) => (
          <div key={stage} className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {STAGE_LABELS[stage]}
              </h2>
              <span className="figure text-xs text-ink-faint">{stageDeals.length}</span>
            </div>
            <div className="space-y-3">
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  className={`rounded-lg border border-line border-t-4 ${STAGE_COLORS[stage]} bg-surface p-3 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{deal.accountName}</p>
                    <Link
                      href={`/opportunities/${deal.id}`}
                      className="shrink-0 text-xs font-medium text-accent hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                  <p className="text-xs text-ink-soft">{deal.title}</p>
                  <p className="figure mt-1 text-sm font-semibold text-ink">
                    {formatCompactINR(deal.value)}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {deal.oem} · {DEAL_CATEGORY_LABELS[deal.category] ?? deal.category}
                  </p>
                  <p className="text-xs text-ink-faint">{quarterLabel(deal.fiscalQuarter, deal.fiscalYear)}</p>
                  <p className="text-xs text-ink-faint">
                    Owner: {deal.salesOwnerName ?? "Unassigned"}
                    {deal.presalesOwnerName ? ` · Presales: ${deal.presalesOwnerName}` : ""}
                  </p>
                  {deal.lostReason && (
                    <p className="mt-1 text-xs font-medium text-danger">
                      Lost: {LOST_REASON_LABELS[deal.lostReason]}
                    </p>
                  )}
                  <form action={updateDealStage} className="mt-2 flex flex-col gap-1">
                    <input type="hidden" name="dealId" value={deal.id} />
                    <select
                      name="stage"
                      defaultValue={deal.stage}
                      className="rounded border border-line bg-paper px-1.5 py-1 text-xs"
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
                      className="rounded border border-line bg-paper px-1.5 py-1 text-xs"
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
                      className="rounded bg-paper px-1.5 py-1 text-xs font-medium text-ink-soft hover:bg-line"
                    >
                      Update stage
                    </button>
                  </form>
                </div>
              ))}
              {stageDeals.length === 0 && (
                <p className="px-1 text-xs text-ink-faint">No deals</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

