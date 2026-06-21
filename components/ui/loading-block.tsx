import { cn } from "@/lib/utils";

export function LoadingBlock({
  message,
  className,
  size = "md",
}: {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const spinnerSize =
    size === "sm" ? "size-6" : size === "lg" ? "size-12" : "size-10";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn("receipt-spinner", spinnerSize)} />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}

export function LoadingOverlay({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/85 backdrop-blur-[1px]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="receipt-spinner size-10" />
      {message ? (
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
