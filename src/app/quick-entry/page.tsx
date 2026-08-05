import { getQuickEntryData } from "@/lib/queries";
import { createLead, logActivity } from "@/lib/actions";
import {
  LEAD_SOURCE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuickEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const { accounts, users, openLeads, openDeals } = await getQuickEntryData();
  const owners = users.filter(
    (u) => u.role === "SALES" || u.role === "ACCOUNT_MANAGER" || u.role === "BU_HEAD"
  );

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold tracking-tight text-ink">Quick Entry</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Log a new lead or an update against an existing lead/deal in under a minute.
      </p>

      {created && (
        <div className="mb-6 rounded-md bg-positive-soft px-4 py-2 text-sm text-positive">
          {created === "lead" ? "Lead logged." : "Activity logged."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">New Lead</h2>
          <form action={createLead} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Contact name *
              </label>
              <input
                name="contactName"
                required
                className="w-full rounded-md border border-line px-2 py-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
                <input
                  name="contactEmail"
                  type="email"
                  className="w-full rounded-md border border-line px-2 py-1.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Phone</label>
                <input
                  name="contactPhone"
                  className="w-full rounded-md border border-line px-2 py-1.5"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Existing account
              </label>
              <select
                name="accountId"
                className="w-full rounded-md border border-line px-2 py-1.5"
              >
                <option value="">{"— none —"}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Or new account name
              </label>
              <input
                name="newAccountName"
                className="w-full rounded-md border border-line px-2 py-1.5"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Source</label>
              <select
                name="source"
                className="w-full rounded-md border border-line px-2 py-1.5"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Owner *</label>
              <select
                name="ownerId"
                required
                className="w-full rounded-md border border-line px-2 py-1.5"
              >
                {owners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-ink px-3 py-2 text-white hover:bg-ink/80"
            >
              Save Lead
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-line bg-surface p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Log Activity</h2>
          <form action={logActivity} className="space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Lead / Deal *
              </label>
              <select
                name="target"
                required
                className="w-full rounded-md border border-line px-2 py-1.5"
              >
                <optgroup label="Leads">
                  {openLeads.map((l) => (
                    <option key={l.id} value={`lead:${l.id}`}>
                      {l.contactName} {l.account ? `(${l.account.name})` : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Deals">
                  {openDeals.map((d) => (
                    <option key={d.id} value={`deal:${d.id}`}>
                      {d.account.name} {"—"} {d.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Type</label>
              <select
                name="type"
                className="w-full rounded-md border border-line px-2 py-1.5"
              >
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Note *</label>
              <textarea
                name="note"
                required
                rows={4}
                className="w-full rounded-md border border-line px-2 py-1.5"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Logged by *</label>
              <select
                name="userId"
                required
                className="w-full rounded-md border border-line px-2 py-1.5"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-ink px-3 py-2 text-white hover:bg-ink/80"
            >
              Save Activity
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
