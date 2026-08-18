import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { InvoiceButton } from "@/components/account/invoice-button";
import { LedgerTable } from "@/components/account/ledger-table";
import { WhoOwesTable } from "@/components/account/who-owes-table";
import { RecordPaymentDialog } from "@/components/account/record-payment-dialog";
import { FeeSettingsDialog } from "@/components/account/fee-settings-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  currentMember,
  members,
  feeSettings,
  ledgerForMember,
  balanceForMember,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

const THIRTY_DAYS_AGO = "2026-07-18";

export default function AccountPage() {
  const isAdmin = currentMember.role === "admin";
  const entries = ledgerForMember(currentMember.id);
  const recentEntries = entries.filter((e) => e.date >= THIRTY_DAYS_AGO);
  const balance = balanceForMember(currentMember.id);
  const owedItems = entries
    .slice()
    .reverse()
    .reduce<{ label: string; amount: number }[]>((acc, entry) => {
      if (entry.type === "charge") acc.push({ label: entry.label, amount: entry.amount });
      return acc;
    }, [])
    .slice(-3);

  return (
    <div>
      <PageHeader
        title="My Account"
        description="Your balance is private — only you and the treasurer can see it."
        actions={<InvoiceButton />}
      />

      <div className="flex flex-col gap-6 p-4 sm:p-8">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current balance</p>
              <p className="font-heading mt-1 text-4xl font-semibold text-foreground">
                {formatCurrency(Math.abs(balance))}
              </p>
              <StatusBadge tone={balance > 0 ? "cardinal" : "grass"} className="mt-2">
                {balance > 0
                  ? "Balance owed"
                  : balance < 0
                    ? "Credit on account"
                    : "Paid up"}
              </StatusBadge>
            </div>
            {balance > 0 && owedItems.length > 0 && (
              <div className="rounded-lg bg-muted px-4 py-3 text-sm sm:min-w-64">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Made up of
                </p>
                <ul className="flex flex-col gap-1">
                  {owedItems.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-4">
                      <span className="text-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Activity — last 30 days
            </h2>
            <div className="mt-3">
              <LedgerTable entries={recentEntries} />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Treasurer tools
              </h2>
              <div className="flex gap-2">
                <FeeSettingsDialog settings={feeSettings} />
                <RecordPaymentDialog members={members} />
              </div>
            </div>

            <Card>
              <CardContent>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Who owes money
                </h3>
                <div className="mt-3">
                  <WhoOwesTable members={members} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
