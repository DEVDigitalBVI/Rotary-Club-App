import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("col-span-full flex flex-col items-center rounded-[1.5rem] border border-dashed border-border bg-card/45 px-6 py-12 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="font-heading mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
