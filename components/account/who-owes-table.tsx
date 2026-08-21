import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberAvatar } from "@/components/member-avatar";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import {
  balanceForMember,
  overdueBalanceForMember,
  type Member,
} from "@/lib/mock-data";

export function WhoOwesTable({ members }: { members: Member[] }) {
  const owing = members
    .map((m) => ({
      member: m,
      balance: balanceForMember(m.id),
      overdue: overdueBalanceForMember(m.id),
    }))
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.overdue - a.overdue || b.balance - a.balance);

  if (owing.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Everyone is paid up. 🎉
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead className="text-right">Balance owed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {owing.map(({ member, balance, overdue }) => (
          <TableRow key={member.id}>
            <TableCell>
              <Link
                href={`/directory/${member.id}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <MemberAvatar
                  member={member}
                  className="size-7"
                  fallbackClassName="text-[0.6rem]"
                />
                <span className="font-medium">{member.name}</span>
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <StatusBadge tone={overdue > 0 ? "cardinal" : "gold"}>
                {formatCurrency(balance)}
              </StatusBadge>
              {overdue > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(overdue)} overdue
                </p>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
