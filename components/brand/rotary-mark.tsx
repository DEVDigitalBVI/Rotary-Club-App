import { cn } from "@/lib/utils";

export function BrandLockup({
  className,
  logoClassName,
}: {
  className?: string;
  logoClassName?: string;
}) {
  return (
    <div className={cn("inline-flex w-fit items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/rotary-club-logo.png"
        alt="Rotary Club of Road Town"
        className={cn("h-14 w-auto", logoClassName)}
      />
    </div>
  );
}
