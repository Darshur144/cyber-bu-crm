import { notFound } from "next/navigation";
import { getDealDetail } from "@/lib/queries";
import { updateDeal } from "@/lib/actions";
import {
  ACTIVITY_TYPE_LABELS,
  DEAL_CATEGORY_LABELS,
  DEAL_CATEGORY_ORDER,
  LOST_REASON_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  formatCompactINR,
} from "@/lib/format";
import { Card, Field, GhostButton, PageHeader, PrimaryButton, StatCard, inputClass } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { deal, accounts, users } = await getDealDetail(id);
  if (!deal) notFound();

  return (
    <div>
      <div className="mb-4">
        <GhostButton href="/opportunities">← Opportunities</GhostButton>
      </div>
      <PageHeader
        title={deal.account.name}
        subtitle={
          <>
            {deal.title}
            {deal.externalDealId ? <span className="figure"> · {deal.externalDealId}</span> : null}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Value" value={formatCompactINR(deal.value)} />
        <StatCard label="Stage" value={STAGE_LABELS[deal.stage] ?? deal.stage} />
        <StatCard label="Owner" value={deal.salesOwner?.name ?? "Unassigned"} />
        <StatCard label="OEM" value={deal.oem} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form action={updateDeal} className="space-y-4 lg:col-span-3">
          <Card title="Deal record">
            <div className="space-y-3">
              <input type="hidden" name="dealId" value={deal.id} />
              <Field label="Title *">
                <input name="title" required defaultValue={deal.title} className={inputClass} />
              </Field>
              <Field label="Account *">
                <select name="accountId" required defaultValue={deal.accountId} className={inputClass}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="OEM / Vendor *">
                  <input name="oem" required defaultValue={deal.oem} className={inputClass} />
                </Field>
                <Field label="Category">
                  <select name="category" defaultValue={deal.category} className={inputClass}>
                    {DEAL_CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {DEAL_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Value (INR) *">
                  <input type="number" name="value" required defaultValue={deal.value} className={inputClass} />
                </Field>
                <Field label="Fiscal quarter">
                  <input type="number" name="fiscalQuarter" min={1} max={4} defaultValue={deal.fiscalQuarter ?? ""} className={inputClass} />
                </Field>
                <Field label="Fiscal year">
                  <input type="number" name="fiscalYear" defaultValue={deal.fiscalYear ?? ""} className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stage">
                  <select name="stage" defaultValue={deal.stage} className={inputClass}>
                    {STAGE_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Lost reason (if lost)">
                  <select name="lostReason" defaultValue={deal.lostReason ?? ""} className={inputClass}>
                    <option value="">—</option>
                    {Object.entries(LOST_REASON_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sales owner">
                  <select name="salesOwnerId" defaultValue={deal.salesOwnerId ?? ""} className={inputClass}>
                    <option value="">— unassigned —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Presales owner">
                  <select name="presalesOwnerId" defaultValue={deal.presalesOwnerId ?? ""} className={inputClass}>
                    <option value="">— unassigned —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {deal.sourceStatus && (
                <p className="text-xs text-ink-faint">Original tracker status: {deal.sourceStatus}</p>
              )}
              <PrimaryButton type="submit">Save changes</PrimaryButton>
            </div>
          </Card>
        </form>

        <Card title="Activity">
          {deal.activities.length === 0 ? (
            <p className="text-sm text-ink-faint">No activity logged.</p>
          ) : (
            <ol className="space-y-4">
              {deal.activities.map((a) => (
                <li key={a.id} className="border-l border-accent pl-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
                    {ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                  </p>
                  <p className="mt-1 text-sm text-ink">{a.note}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {a.user?.name ?? "Unknown"} · {a.createdAt.toLocaleDateString("en-IN")}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
