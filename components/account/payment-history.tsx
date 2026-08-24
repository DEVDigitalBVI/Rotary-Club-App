import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment, PaymentMethod } from "@/lib/mock-data";

const methodLabel: Record<PaymentMethod, string> = {
  cash: "Cash",
  check: "Check",
  online: "Online",
};

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No payments recorded yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Applied to</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="text-muted-foreground">
              {formatDate(payment.txnDate)}
            </TableCell>
            <TableCell>
              <p className="text-foreground">{methodLabel[payment.method]}</p>
              {payment.reference && (
                <p className="text-xs text-muted-foreground">{payment.reference}</p>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {payment.appliedTo ? `Invoice ${payment.appliedTo}` : "—"}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatCurrency(payment.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
