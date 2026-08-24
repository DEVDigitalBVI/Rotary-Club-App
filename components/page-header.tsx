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
    <div className="flex flex-col gap-4 px-4 pb-5 pt-8 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-7 sm:pt-10">
      <div>
        <p className="font-label mb-2 text-[0.62rem] text-primary/70">Rotary Club of Road Town</p>
        <h1 className="font-heading text-3xl font-semibold leading-none text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
