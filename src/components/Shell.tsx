import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, HardHat, Boxes, Receipt, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/contratos", label: "Contratos", icon: FileText },
  { to: "/funcionarios", label: "Funcionários", icon: HardHat },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/despesas", label: "Despesas", icon: Receipt },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BrandLogo({ size = 44 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  // Rings from outer to inner – alternating filled / gap
  const rings = [
    { r: 20, stroke: "#B28259", width: 4.5, opacity: 0.85 },
    { r: 14.5, stroke: "#B28259", width: 3.5, opacity: 0.55 },
    { r: 9.5, stroke: "#B28259", width: 3, opacity: 0.75 },
    { r: 5, stroke: "#B28259", width: 2.5, opacity: 0.5 },
  ];
  const scale = size / 44;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {rings.map((ring, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={ring.r * scale}
          stroke={ring.stroke}
          strokeWidth={ring.width * scale}
          opacity={ring.opacity}
          fill="none"
        />
      ))}
      {/* centre dot */}
      <circle cx={cx} cy={cy} r={1.8 * scale} fill="#fff" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
      <div className="shrink-0">
        <BrandLogo size={44} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-sidebar-foreground/80">Fábrica de cabos</p>
        <p className="truncate text-[15px] font-extrabold text-sidebar-primary">Padre Cicero</p>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto p-4 text-[11px] leading-relaxed text-sidebar-foreground/45">
          CRM interno · produção de cabos em madeira
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <Brand />
            <NavList onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border"
            aria-label="Abrir menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <span className="truncate text-sm font-semibold">Fábrica de Cabos Padre Cícero</span>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
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
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
