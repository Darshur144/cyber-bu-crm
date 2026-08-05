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
import { DEAL_CATEGORY_LABELS, formatCompactINR, formatINR } from "@/lib/format";

const PALETTE = [
  "var(--color-accent)",
  "var(--color-positive)",
  "var(--color-warning)",
  "var(--color-danger)",
  "#6366f1",
  "#0d9488",
  "#a855f7",
  "#14171f",
];
const GRID = "var(--color-line)";
const AXIS = "var(--color-ink-faint)";

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

  if (chartData.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-faint">No leads logged yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke={AXIS} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke={AXIS} width={90} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TargetVsActualChart({
  data,
}: {
  data: { ownerName: string; target: number; actual: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-faint">No targets set for this month.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="ownerName" tick={{ fontSize: 12 }} stroke={AXIS} />
        <YAxis tickFormatter={(v) => formatCompactINR(v)} tick={{ fontSize: 11 }} stroke={AXIS} width={60} />
        <Tooltip formatter={(value: unknown) => formatINR(Number(value) || 0)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="target" fill="var(--color-line)" radius={[4, 4, 0, 0]} name="Target" />
        <Bar dataKey="actual" fill="var(--color-ink)" radius={[4, 4, 0, 0]} name="Actual (won)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryMixChart({ data }: { data: { category: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-faint">No open pipeline.</p>;
  }
  const chartData = data.map((d) => ({ name: DEAL_CATEGORY_LABELS[d.category] ?? d.category, value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
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

export function OemMixChart({ data }: { data: { oem: string; value: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-faint">No open pipeline.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatCompactINR(v)} tick={{ fontSize: 11 }} stroke={AXIS} />
        <YAxis type="category" dataKey="oem" tick={{ fontSize: 12 }} stroke={AXIS} width={80} />
        <Tooltip formatter={(value: unknown) => formatINR(Number(value) || 0)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="value" fill="var(--color-accent)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

