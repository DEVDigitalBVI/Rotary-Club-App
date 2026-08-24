import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  children,
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-[1400px] p-4 sm:p-8", className)}>
      {children}
    </div>
  );
}

