"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  LOST_REASON_LABELS,
  SERVICE_LINE_LABELS,
  formatCompactINR,
  formatINR,
  monthLabel,
} from "@/lib/format";

const PALETTE = ["#0f172a", "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

type MonthlyPoint = {
  month: number;
  year: number;
  wonValue: number;
  wonCount: number;
  lostValue: number;
  lostCount: number;
};

export function MonthlyClosuresChart({ data }: { data: MonthlyPoint[] }) {
  const chartData = data.map((d) => ({
    name: monthLabel(d.month, d.year),
    Won: d.wonValue,
    Lost: d.lostValue,
    wonCount: d.wonCount,
    lostCount: d.lostCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tickFormatter={(v) => formatCompactINR(v)} tick={{ fontSize: 11 }} stroke="#94a3b8" width={60} />
        <Tooltip
          formatter={(value: unknown) => formatINR(Number(value) || 0)}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Won" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LeadFunnelChart({ data }: { data: { status: string; count: number }[] }) {
  const order = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "DISQUALIFIED"];
  const labels: Record<string, string> = {
    NEW: "New",
    CONTACTED: "Contacted",
    QUALIFIED: "Qualified",
    CONVERTED: "Converted",
    DISQUALIFIED: "Disqualified",
  };
  const chartData = order
    .map((status) => ({
      name: labels[status],
      count: data.find((d) => d.status === status)?.count ?? 0,
    }))
    .filter((d) => d.count > 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" width={90} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LostReasonChart({ data }: { data: { reason: string; count: number; value: number }[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">No lost deals yet.</p>;
  }
  const chartData = data.map((d) => ({
    name: LOST_REASON_LABELS[d.reason] ?? d.reason,
    value: d.value,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={(entry: { name?: string; count?: number }) => `${entry.name} (${entry.count})`}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: unknown) => formatINR(Number(value) || 0)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ServiceLineMixChart({ data }: { data: { serviceLine: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">No won deals yet.</p>;
  }
  const chartData = data.map((d) => ({
    name: SERVICE_LINE_LABELS[d.serviceLine] ?? d.serviceLine,
    value: d.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: unknown) => formatINR(Number(value) || 0)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TargetVsActualChart({
  data,
}: {
  data: { ownerName: string; target: number; actual: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-slate-400">No targets set for this month.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="ownerName" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tickFormatter={(v) => formatCompactINR(v)} tick={{ fontSize: 11 }} stroke="#94a3b8" width={60} />
        <Tooltip formatter={(value: unknown) => formatINR(Number(value) || 0)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target" />
        <Bar dataKey="actual" fill="#0f172a" radius={[4, 4, 0, 0]} name="Actual (won)" />
      </BarChart>
    </ResponsiveContainer>
  );
}


