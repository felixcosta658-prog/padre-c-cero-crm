export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Fábrica de cabos Padre Cicero">
      <defs>
        <linearGradient id="woodGrain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9ab77" />
          <stop offset="45%" stopColor="#c08b52" />
          <stop offset="100%" stopColor="#9a6a38" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#woodGrain)" />
      <g fill="none" stroke="#f7f2ea" strokeWidth="2.6">
        <circle cx="50" cy="52" r="33" />
        <circle cx="50" cy="53" r="21" />
        <circle cx="50" cy="53" r="11" />
      </g>
      <circle cx="50" cy="53" r="4" fill="#f7f2ea" />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-[13px] font-medium leading-tight text-sidebar-foreground/85">
        Fábrica de cabos
      </p>
      <p className="text-[15px] font-extrabold leading-tight tracking-tight text-sidebar-primary">
        Padre Cicero
      </p>
    </div>
  );
}
