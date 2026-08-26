import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8 sm:py-10">
      <span className="sr-only" role="status">Loading page…</span>
      <Skeleton className="h-3 w-36" />
      <Skeleton className="mt-4 h-10 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="rounded-[1.5rem] border border-border bg-card p-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-7 w-3/4" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-7 h-11 w-32 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
