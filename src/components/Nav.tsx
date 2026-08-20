"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/quick-entry", label: "Quick Entry" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="bg-console">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-console-fg">Cyber BU</span>
            <span className="figure text-xs text-console-fg-soft">console</span>
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-console-fg"
                      : "text-console-fg-soft hover:bg-white/5 hover:text-console-fg"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
