"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/executive-dashboard", label: "Executive Dashboard" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/renewals", label: "Renewals" },
  { href: "/oem", label: "OEM" },
  { href: "/lead-generation", label: "Lead Generation" },
  { href: "/accounts", label: "Accounts" },
  { href: "/our-people", label: "Our People" },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-console px-3 py-4 lg:w-[210px] lg:border-b-0 lg:border-r">
      <Link href="/executive-dashboard" className="mb-5 flex items-baseline gap-2 px-2">
        <span className="font-mono text-[12.5px] font-bold uppercase tracking-wide text-ink">
          Cyber BU
        </span>
      </Link>
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 font-mono text-xs font-medium whitespace-nowrap transition-colors lg:border-b-0 lg:border-l-2 ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              <span
                className={`h-3.5 w-3.5 shrink-0 rounded-[3px] border ${
                  active ? "border-accent bg-accent/15" : "border-current opacity-50"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
