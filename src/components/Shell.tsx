import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, HardHat, Boxes, Receipt, Menu, X } from "lucide-react";

import { LogoLockup } from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/contratos", label: "Contratos", icon: FileText },
  { to: "/funcionarios", label: "Funcionários", icon: HardHat },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/despesas", label: "Despesas", icon: Receipt },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-5">
        <LogoLockup className="w-full" />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavList onNavigate={onNavigate} />
      </div>
      <p className="px-5 py-4 text-[11px] text-sidebar-foreground/45">
        CRM interno · produção de cabos em madeira
      </p>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="bg-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="bg-sidebar absolute inset-y-0 left-0 flex w-72 flex-col shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="text-sidebar-foreground absolute top-4 right-4 rounded-md p-1.5 hover:bg-sidebar-accent"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:pl-72">
        <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md p-2 hover:bg-muted"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </button>
            <span className="text-sm font-semibold">Fábrica de Cabos Padre Cícero</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="shadow-card rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
        </div>
        <div className="bg-secondary text-primary rounded-xl p-2.5">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
