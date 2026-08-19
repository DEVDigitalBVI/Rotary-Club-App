import { cn } from "@/lib/utils";

export function BrandLockup({
  className,
  logoClassName,
}: {
  className?: string;
  logoClassName?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center rounded-lg px-2.5 py-1.5",
        className
      )}
      style={{ backgroundColor: "var(--rotary-blue)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/rotary-club-logo.png"
        alt="Rotary Club of Road Town"
        className={cn("h-8 w-auto", logoClassName)}
      />
    </div>
  );
}
