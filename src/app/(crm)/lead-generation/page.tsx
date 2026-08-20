import { getLeadRows, getQuickEntryData } from "@/lib/queries";
import { createLead, logActivity } from "@/lib/actions";
import {
  ACTIVITY_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/format";
import { Badge, Card, Field, IconStat, PageHeader, PrimaryButton, inputClass } from "@/components/crm/ui";

export const dynamic = "force-dynamic";

export default async function LeadGenerationPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const [{ stats, rows }, { accounts, users, openLeads, openDeals }] = await Promise.all([
    getLeadRows(),
    getQuickEntryData(),
  ]);
  const owners = users.filter(
    (u) => u.role === "SALES" || u.role === "ACCOUNT_MANAGER" || u.role === "BU_HEAD"
  );

  return (
    <div>
      <PageHeader title="Lead Generation" subtitle="Inbound and outbound motion for the BU" />

      {created && (
        <div className="mb-6 rounded-md border border-accent2/30 bg-accent2/10 px-4 py-2 text-sm text-accent2">
          {created === "lead" ? "Lead logged." : "Activity logged."}
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-8">
        <IconStat label="Leads" value={String(stats.total)} tone="accent2" />
        <IconStat label="New" value={String(stats.newCount)} />
        <IconStat label="Qualified" value={String(stats.qualified)} />
        <IconStat label="Converted" value={String(stats.converted)} tone="accent2" />
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-faint">No leads yet — log one below.</p>
        ) : (
          <div className="mb-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Owner</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/70">
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{row.contactName}</div>
                      <div className="text-xs text-ink-faint">{row.contactEmail ?? ""}</div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{row.accountName ?? "—"}</td>
                    <td className="px-3 py-2.5">{LEAD_SOURCE_LABELS[row.source] ?? row.source}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone="accent2">{LEAD_STATUS_LABELS[row.status] ?? row.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{row.ownerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="New lead">
          <form action={createLead} className="space-y-3">
            <Field label="Contact name *">
              <input name="contactName" required className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input name="contactEmail" type="email" className={inputClass} />
              </Field>
              <Field label="Phone">
                <input name="contactPhone" className={inputClass} />
              </Field>
            </div>
            <Field label="Existing account">
              <select name="accountId" className={inputClass}>
                <option value="">— none —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Or new account name">
              <input name="newAccountName" className={inputClass} />
            </Field>
            <Field label="Source">
              <select name="source" className={inputClass}>
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner *">
              <select name="ownerId" required className={inputClass}>
                {owners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <PrimaryButton type="submit">Save lead</PrimaryButton>
          </form>
        </Card>

        <Card title="Log activity">
          <form action={logActivity} className="space-y-3">
            <Field label="Lead / Deal *">
              <select name="target" required className={inputClass}>
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
                      {d.account.name} — {d.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
            <Field label="Type">
              <select name="type" className={inputClass}>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Note *">
              <textarea name="note" required rows={4} className={inputClass} />
            </Field>
            <Field label="Logged by *">
              <select name="userId" required className={inputClass}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <PrimaryButton type="submit">Save activity</PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
