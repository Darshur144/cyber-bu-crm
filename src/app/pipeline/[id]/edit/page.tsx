import { notFound } from "next/navigation";
import { getDealForEdit } from "@/lib/queries";
import { updateDeal } from "@/lib/actions";
import { STAGE_LABELS, STAGE_ORDER, DEAL_CATEGORY_LABELS, DEAL_CATEGORY_ORDER, LOST_REASON_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { deal, accounts, users } = await getDealForEdit(id);
  if (!deal) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-ink">Edit Deal</h1>
      <p className="figure mb-6 text-sm text-ink-soft">{deal.externalDealId ?? "No external ID"}</p>

      <form action={updateDeal} className="space-y-4 rounded-lg border border-line bg-surface p-5 text-sm">
        <input type="hidden" name="dealId" value={deal.id} />

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Title *</label>
          <input
            name="title"
            required
            defaultValue={deal.title}
            className="w-full rounded-md border border-line px-2 py-1.5"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Account *</label>
          <select
            name="accountId"
            required
            defaultValue={deal.accountId}
            className="w-full rounded-md border border-line px-2 py-1.5"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">OEM / Vendor *</label>
            <input
              name="oem"
              required
              defaultValue={deal.oem}
              className="w-full rounded-md border border-line px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Category</label>
            <select
              name="category"
              defaultValue={deal.category}
              className="w-full rounded-md border border-line px-2 py-1.5"
            >
              {DEAL_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {DEAL_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Value (INR) *</label>
            <input
              type="number"
              name="value"
              required
              defaultValue={deal.value}
              className="w-full rounded-md border border-line px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Fiscal quarter</label>
            <input
              type="number"
              name="fiscalQuarter"
              min={1}
              max={4}
              defaultValue={deal.fiscalQuarter ?? ""}
              className="w-full rounded-md border border-line px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Fiscal year</label>
            <input
              type="number"
              name="fiscalYear"
              defaultValue={deal.fiscalYear ?? ""}
              className="w-full rounded-md border border-line px-2 py-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Stage</label>
            <select
              name="stage"
              defaultValue={deal.stage}
              className="w-full rounded-md border border-line px-2 py-1.5"
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Lost reason (if lost)</label>
            <select
              name="lostReason"
              defaultValue={deal.lostReason ?? ""}
              className="w-full rounded-md border border-line px-2 py-1.5"
            >
              <option value="">—</option>
              {Object.entries(LOST_REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Sales owner</label>
            <select
              name="salesOwnerId"
              defaultValue={deal.salesOwnerId ?? ""}
              className="w-full rounded-md border border-line px-2 py-1.5"
            >
              <option value="">— unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Presales owner</label>
            <select
              name="presalesOwnerId"
              defaultValue={deal.presalesOwnerId ?? ""}
              className="w-full rounded-md border border-line px-2 py-1.5"
            >
              <option value="">— unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {deal.sourceStatus && (
          <p className="text-xs text-ink-faint">Original tracker status: {deal.sourceStatus}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 text-white hover:bg-ink/80"
          >
            Save Changes
          </button>
          <a
            href="/pipeline"
            className="rounded-md border border-line px-4 py-2 text-ink-soft hover:bg-paper"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
