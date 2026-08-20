import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function IconStat({
  label,
  value,
  tone = "accent",
}: {
  label: string;
  value: string;
  tone?: "accent" | "accent2";
}) {
  const border = tone === "accent2" ? "border-accent2 bg-accent2/10" : "border-accent bg-accent/10";
  const glyph = tone === "accent2" ? "border-accent2" : "border-accent";
  return (
    <div className="flex min-w-[120px] flex-col gap-2.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-sm border ${border}`}>
        <span className={`block h-2.5 w-3 rounded-[1px] border ${glyph}`} />
      </div>
      <p className="figure text-2xl font-bold tracking-tight">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-dashed border-line bg-paper p-4 pl-5">
      <div className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">{label}</p>
      <p className="figure mt-1.5 text-xl font-semibold text-ink">{value}</p>
      {hint && <p className="figure mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper p-4">
      {title && (
        <h2 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "accent2" | "danger" | "neutral";
}) {
  const cls =
    tone === "accent2"
      ? "border-transparent bg-accent2/15 text-accent2"
      : tone === "danger"
        ? "border-danger/40 text-danger"
        : tone === "neutral"
          ? "border-line text-ink-soft"
          : "border-accent text-accent";
  return (
    <span
      className={`inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-[#1a1002] hover:brightness-110 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-ink-faint">{children}</p>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "w-full px-2 py-1.5 text-sm";
