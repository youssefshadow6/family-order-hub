import { Delete, Check } from "lucide-react";
import { useState } from "react";

export function NumPad({
  initial = "",
  title,
  subtitle,
  onConfirm,
  onCancel,
}: {
  initial?: string;
  title: string;
  subtitle?: string;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial);

  const tap = (d: string) => {
    setVal((v) => {
      if (v === "0") return d;
      const next = (v + d).slice(0, 5);
      return next;
    });
  };
  const back = () => setVal((v) => v.slice(0, -1));
  const confirm = () => {
    const n = parseInt(val || "0", 10);
    if (n > 0) onConfirm(n);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        )}
        <div className="mt-6 text-8xl font-bold tabular-nums text-foreground">
          {val || "0"}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Quantity</div>
      </div>
      <div className="mx-auto w-full max-w-md p-4">
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => tap(k)}
              className="h-16 rounded-2xl bg-card text-3xl font-semibold text-foreground shadow-[var(--shadow-card)] active:scale-95 active:bg-muted transition"
            >
              {k}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="h-16 rounded-2xl bg-muted text-base font-semibold text-muted-foreground active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => tap("0")}
            className="h-16 rounded-2xl bg-card text-3xl font-semibold text-foreground shadow-[var(--shadow-card)] active:scale-95 active:bg-muted transition"
          >
            0
          </button>
          <button
            onClick={back}
            className="h-16 rounded-2xl bg-muted text-foreground flex items-center justify-center active:scale-95"
            aria-label="Delete"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
        <button
          onClick={confirm}
          disabled={!val || val === "0"}
          className="mt-3 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-lg font-bold text-primary-foreground shadow-[var(--shadow-soft)] active:scale-[0.98] disabled:opacity-40"
        >
          <Check className="h-6 w-6" />
          Confirm
        </button>
      </div>
    </div>
  );
}