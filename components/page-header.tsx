export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/70 bg-card/35">
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-5 pt-8 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-7 sm:pt-10">
      <div>
        <p className="font-label mb-2 text-[0.62rem] text-primary/70">Rotary Club of Road Town</p>
        <h1 className="font-heading text-3xl font-semibold leading-none text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">{actions}</div>}
    </div>
    </div>
  );
}
