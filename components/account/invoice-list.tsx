import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, daysBetween } from "@/lib/format";
import { isOverdue, type Invoice } from "@/lib/mock-data";

/**
 * QuickBooks shows an invoice as a document; a member mostly wants to know
 * what it covers and when it's due. The line items are always expanded
 * because "why do I owe $60" is the actual question being asked, and a club
 * invoice is only ever a handful of lines.
 */
export function InvoiceList({
  invoices,
  today,
}: {
  invoices: Invoice[];
  today: string;
}) {
  if (invoices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing outstanding — you&apos;re all paid up.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {invoices.map((invoice) => (
        <li
          key={invoice.id}
          className="rounded-lg border border-border p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">
                Invoice {invoice.docNumber}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Issued {formatDate(invoice.txnDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading text-xl font-semibold text-foreground">
                {formatCurrency(invoice.balance)}
              </p>
              <DueBadge invoice={invoice} today={today} />
            </div>
          </div>

          <ul className="mt-3 flex flex-col divide-y divide-border border-t border-border">
            {invoice.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-baseline justify-between gap-4 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="text-foreground">{line.description}</span>
                  {line.serviceDate && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatDate(line.serviceDate, { year: undefined })}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatCurrency(line.amount)}
                </span>
              </li>
            ))}
          </ul>

          {invoice.balance > 0 && invoice.balance !== invoice.total && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatCurrency(invoice.total - invoice.balance)} of{" "}
              {formatCurrency(invoice.total)} already paid.
            </p>
          )}

          {invoice.paymentLink && (
            <Button
              className="font-heading mt-3 w-full sm:w-auto"
              nativeButton={false}
              render={
                <a
                  href={invoice.paymentLink}
                  target="_blank"
                  rel="noreferrer noopener"
                />
              }
            >
              Pay this invoice
              <ExternalLink className="size-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function DueBadge({ invoice, today }: { invoice: Invoice; today: string }) {
  if (invoice.balance === 0) {
    return <StatusBadge tone="grass" className="mt-1">Paid</StatusBadge>;
  }

  const days = daysBetween(today, invoice.dueDate);

  if (isOverdue(invoice, today)) {
    const overdueBy = Math.abs(days);
    return (
      <StatusBadge tone="cardinal" className="mt-1">
        {overdueBy === 0
          ? "Overdue"
          : `Overdue by ${overdueBy} ${overdueBy === 1 ? "day" : "days"}`}
      </StatusBadge>
    );
  }

  if (days === 0) {
    return <StatusBadge tone="gold" className="mt-1">Due today</StatusBadge>;
  }

  return (
    <StatusBadge tone={days <= 7 ? "gold" : "sky"} className="mt-1">
      Due in {days} {days === 1 ? "day" : "days"}
    </StatusBadge>
  );
}
