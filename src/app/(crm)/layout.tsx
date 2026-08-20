import { Sidebar } from "@/components/Sidebar";
import { ProductSwitch } from "@/components/ProductSwitch";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crm-app flex min-h-full flex-1 flex-col lg:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3 lg:px-7">
          <div className="lg:hidden">
            <ProductSwitch />
          </div>
          <div className="ml-auto rounded-md border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-soft">
            Account ▾
          </div>
        </header>
        <main className="flex-1 px-5 py-6 lg:px-7">{children}</main>
      </div>
    </div>
  );
}
