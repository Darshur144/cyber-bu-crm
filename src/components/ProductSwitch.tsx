"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const products = [
  { href: "/executive-dashboard", label: "Cyber BU Console", match: (path: string) => !path.startsWith("/telemetry") },
  { href: "/telemetry", label: "AI Telemetry", match: (path: string) => path.startsWith("/telemetry") },
];

export function ProductSwitch() {
  const pathname = usePathname() ?? "";

  return (
    <div className="flex rounded-md border border-current/15 p-0.5 text-xs">
      {products.map((product) => {
        const active = product.match(pathname);
        return (
          <Link
            key={product.href}
            href={product.href}
            className={`rounded px-2 py-1 font-medium transition-colors ${
              active ? "bg-white/12 text-inherit" : "opacity-60 hover:opacity-100"
            }`}
          >
            {product.label}
          </Link>
        );
      })}
    </div>
  );
}
