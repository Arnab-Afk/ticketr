import { cn } from "@/lib/utils";

export function ReceiptPaper({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "wide" | "full";
}) {
  return (
    <div
      className={cn(
        "receipt-paper mx-auto border border-border shadow-none",
        width === "wide" && "max-w-3xl",
        width === "full" && "max-w-full",
        width === "default" && "max-w-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="receipt-row grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2 py-1.5 text-sm">
      <span className="whitespace-nowrap text-foreground">{label}</span>
      <span className="receipt-dots overflow-hidden text-muted-foreground" aria-hidden>
        ...............................
      </span>
      <span className={cn("text-right whitespace-nowrap", bold && "font-bold")}>
        {value}
      </span>
    </div>
  );
}

export function ReceiptDivider({ dashed = true }: { dashed?: boolean }) {
  return (
    <hr
      className={cn(
        "my-3 border-0 border-t border-foreground/25",
        dashed ? "border-dashed" : "border-solid"
      )}
    />
  );
}

export function ReceiptSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="receipt-section-title border-t border-dotted border-primary/30 pt-2.5 pb-1.5 text-xs font-bold tracking-wide uppercase text-primary">
      {children}
    </p>
  );
}

export function ReceiptMeta({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[11px] font-bold tracking-[0.14em] uppercase text-primary">
      <span>{left}</span>
      <span className="tracking-normal">{right}</span>
    </div>
  );
}

export function ReceiptStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="receipt-stat">
      <span className="receipt-label text-[10px] text-primary/70">{label}</span>
      <span className="receipt-dots flex-1 overflow-hidden text-primary/20" aria-hidden>
        ...............................
      </span>
      <span className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
        {value}
      </span>
    </div>
  );
}

export function ReceiptStatStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("receipt-stat-strip divide-y divide-dashed divide-primary/20", className)}>
      {children}
    </div>
  );
}
