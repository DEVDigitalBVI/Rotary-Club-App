import { cn } from "@/lib/utils";

export function RotaryMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        className
      )}
      style={{
        background:
          "conic-gradient(from 220deg, var(--rotary-blue), var(--rotary-azure) 35%, var(--rotary-gold) 70%, var(--rotary-blue))",
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[15%] rounded-full bg-[var(--sidebar,var(--background))]"
        style={{ backgroundColor: "var(--background)" }}
      />
    </span>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <RotaryMark className="size-8" />
      <div className="flex flex-col leading-none">
        <span className="font-heading text-[0.95rem] font-semibold tracking-tight text-foreground">
          Rotary Club
        </span>
        <span className="text-[0.7rem] font-medium text-muted-foreground">
          Member Portal
        </span>
      </div>
    </div>
  );
}
