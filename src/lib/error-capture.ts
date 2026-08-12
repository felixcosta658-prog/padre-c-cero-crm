let lastCaptured: { message: string; stack: string } | null = null;
let captureTtl: ReturnType<typeof setTimeout> | null = null;

function flatten(err: unknown, limit = 5): { message: string; stack: string } {
  let message = "";
  let stack = "";
  const seen = new Set<unknown>();

  const walk = (e: unknown, depth: number, prefix: string) => {
    if (depth > limit || !e || seen.has(e)) return;
    seen.add(e);
    const err = e as { message?: unknown; stack?: unknown; cause?: unknown };
    if (err.message) message += `${prefix}${err.message}\n`;
    if (err.stack) stack += `${prefix}${err.stack}\n`;
    if (err.cause) walk(err.cause, depth + 1, `${prefix}  cause → `);
  };

  walk(err, 0, "");
  const cut = (s: string) => (s.length > 8000 ? `${s.slice(0, 8000)}…` : s);
  return { message: cut(message.trim()), stack: cut(stack.trim()) };
}

export function captureError(err: unknown) {
  const flat = flatten(err);
  if (!flat.message && !flat.stack) return;
  lastCaptured = flat;
  if (captureTtl) clearTimeout(captureTtl);
  captureTtl = setTimeout(() => {
    lastCaptured = null;
  }, 5000);
}

export function consumeLastCapturedError() {
  const e = lastCaptured;
  lastCaptured = null;
  return e;
}

const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  originalError(...args);
  for (const a of args) {
    if (a instanceof Error) captureError(a);
    else if (typeof a === "string" && a) {
      const m = new Error(a);
      captureError(m);
      break;
    }
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => captureError(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => captureError(e.reason));
}
