import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { SyncStatus } from "@/components/account/sync-status";
import { InvoiceList } from "@/components/account/invoice-list";
import { PaymentHistory } from "@/components/account/payment-history";
import { WhoOwesTable } from "@/components/account/who-owes-table";
import { AttendanceSummaryCard } from "@/components/account/attendance-summary";
import { PendingMakeups } from "@/components/account/pending-makeups";
import { Card, CardContent } from "@/components/ui/card";
import {
  currentMember,
  members,
  invoicesForMember,
  paymentsForMember,
  balanceForMember,
  overdueBalanceForMember,
  quickbooksSync,
  isOverdue,
  canAssignRoles,
  TODAY,
} from "@/lib/mock-data";
import { formatCurrency, formatDate, daysBetween } from "@/lib/format";
import { getCurrentMember } from "@/lib/data/members";
import { getMemberAttendanceSummary, getPendingMakeups } from "@/lib/data/attendance";
import { PageContainer } from "@/components/page-container";

export default async function AccountPage() {
  // Finance below is still QuickBooks-mock data (not wired to Supabase yet),
  // so it deliberately keeps using the mock currentMember/members. Attendance
  // is real, so it's fetched separately against the signed-in member's
  // actual row.
  const isAdmin = currentMember.role === "admin";
  const allInvoices = invoicesForMember(currentMember.id);
  const openInvoices = allInvoices.filter((invoice) => invoice.balance > 0);
  const balance = balanceForMember(currentMember.id);
  const overdue = overdueBalanceForMember(currentMember.id);

  const realMember = await getCurrentMember();
  const mayManageAttendance = realMember ? canAssignRoles(realMember) : false;
  const [attendanceSummary, pendingMakeups] = await Promise.all([
    realMember ? getMemberAttendanceSummary(realMember.id) : null,
    mayManageAttendance ? getPendingMakeups() : Promise.resolve([]),
  ]);

  // The soonest thing the member actually has to act on.
  const nextDue = [...openInvoices]
    .filter((invoice) => !isOverdue(invoice))
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))[0];

  return (
    <div>
      <PageHeader
        title="My Account"
        description="Your balance is private — only you and the treasurer can see it."
        actions={
          <SyncStatus
            lastSyncedAt={quickbooksSync.lastSyncedAt}
            status={quickbooksSync.status}
          />
        }
      />

      <PageContainer className="flex flex-col gap-6">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {balance > 0 ? "You owe" : "Current balance"}
              </p>
              <p className="font-heading mt-1 text-4xl font-semibold text-foreground">
                {formatCurrency(balance)}
              </p>

              {balance === 0 ? (
                <StatusBadge tone="grass" className="mt-2">
                  Paid up
                </StatusBadge>
              ) : overdue > 0 ? (
                <StatusBadge tone="cardinal" className="mt-2">
                  {formatCurrency(overdue)} overdue
                </StatusBadge>
              ) : (
                <StatusBadge tone="sky" className="mt-2">
                  {openInvoices.length === 1
                    ? "1 open invoice"
                    : `${openInvoices.length} open invoices`}
                </StatusBadge>
              )}

              {nextDue && overdue === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Due {formatDate(nextDue.dueDate)} —{" "}
                  {describeDaysUntil(daysBetween(TODAY, nextDue.dueDate))}.
                </p>
              )}
            </div>

            {balance > 0 && (
              <div className="rounded-lg bg-muted px-4 py-3 text-sm sm:max-w-64">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  How to pay
                </p>
                <p className="text-foreground">
                  Pay at the hospitality desk, or contact the treasurer to
                  arrange payment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Open invoices
            </h2>
            <div className="mt-3">
              <InvoiceList invoices={openInvoices} today={TODAY} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Payment history
            </h2>
            <div className="mt-3">
              <PaymentHistory payments={paymentsForMember(currentMember.id)} />
            </div>
          </CardContent>
        </Card>

        {attendanceSummary && realMember && (
          <>
            <div className="mt-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Attendance
              </h2>
            </div>
            <AttendanceSummaryCard memberId={realMember.id} summary={attendanceSummary} />
          </>
        )}

        {isAdmin && (
          <>
            <div className="mt-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Treasurer view
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Read-only. Invoices and payments are created in QuickBooks —
                this is a view of what&apos;s there.
              </p>
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

        {mayManageAttendance && (
          <>
            <div className="mt-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Secretary: attendance
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Meeting attendance is taken from each event&apos;s page.
                Makeups members log themselves still need entering into
                ClubRunner.
              </p>
            </div>
            <PendingMakeups makeups={pendingMakeups} />
          </>
        )}
      </PageContainer>
    </div>
  );
}

function describeDaysUntil(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
