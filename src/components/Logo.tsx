export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#d97706" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#f7f2ea" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="#f7f2ea" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="14" fill="none" stroke="#f7f2ea" strokeWidth="2.6" />
      <circle cx="50" cy="50" r="4" fill="#f7f2ea" />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark className="size-14 shrink-0" />
      <div className="leading-tight">
        <p className="text-sm font-medium text-white">Fábrica de cabos</p>
        <p className="text-xl font-extrabold text-[#e0852f]">Padre Cícero</p>
      </div>
    </div>
  );
}
