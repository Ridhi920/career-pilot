"use client";

/** Page title block — clear title, plain-English description. */
export function ModuleHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-wide text-foreground uppercase">
            {title}
          </h1>
          <p className="text-[0.84rem] text-muted-foreground mt-2">{description}</p>
        </div>
        {action && <div className="flex gap-2 pb-1">{action}</div>}
      </div>
      <div className="axis mt-5" />
    </div>
  );
}
