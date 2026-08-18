import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { LedgerEntry } from "@/lib/mock-data";

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity in the last 30 days.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-muted-foreground">
              {formatDate(entry.date)}
            </TableCell>
            <TableCell>
              <p className="font-medium text-foreground">{entry.label}</p>
              {entry.meta && (
                <p className="text-xs text-muted-foreground">{entry.meta}</p>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge tone={entry.type === "charge" ? "cardinal" : "grass"}>
                {entry.type === "charge" ? "Charge" : "Payment"}
              </StatusBadge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {entry.type === "charge" ? "+" : "−"}
              {formatCurrency(entry.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
