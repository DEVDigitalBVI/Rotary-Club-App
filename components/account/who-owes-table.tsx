import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import { balanceForMember, type Member } from "@/lib/mock-data";

export function WhoOwesTable({ members }: { members: Member[] }) {
  const owing = members
    .map((m) => ({ member: m, balance: balanceForMember(m.id) }))
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.balance - a.balance);

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
        {owing.map(({ member, balance }) => (
          <TableRow key={member.id}>
            <TableCell>
              <Link
                href={`/directory/${member.id}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Avatar className="size-7">
                  <AvatarFallback
                    className="text-[0.6rem] font-semibold text-white"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{member.name}</span>
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <StatusBadge tone="cardinal">{formatCurrency(balance)}</StatusBadge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
