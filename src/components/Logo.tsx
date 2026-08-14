export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#2f473a" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#e8ede7" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="#e8ede7" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="14" fill="none" stroke="#e8ede7" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="4" fill="#e8ede7" />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-[#eeede9] px-4 py-3 shadow-sm ${className ?? ""}`}>
      <LogoMark className="size-12 shrink-0" />
      <div className="leading-tight">
        <p className="text-sm font-medium text-[#2f473a]">Fábrica de cabos</p>
        <p className="text-xl font-extrabold text-[#e77829]">Padre Cícero</p>
      </div>
    </div>
  );
}
