"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { AddMemberDialog } from "@/components/directory/add-member-dialog";
import { formatDate } from "@/lib/format";
import type { Member } from "@/lib/mock-data";

export function MemberDirectory({
  members,
  isAdmin,
}: {
  members: Member[];
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [committee, setCommittee] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const committees = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.committees.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [members]);

  const filtered = members.filter((m) => {
    const matchesQuery =
      query.trim().length === 0 ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.classification.toLowerCase().includes(query.toLowerCase());
    const matchesCommittee = committee === "all" || m.committees.includes(committee);
    return matchesQuery && matchesCommittee;
  });

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or classification"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={committee} onValueChange={(v) => setCommittee(v as string)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All committees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All committees</SelectItem>
              {committees.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button className="font-heading" onClick={() => setAddOpen(true)}>
            <Plus />
            Add member
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {members.length} members
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((member) => (
          <Link key={member.id} href={`/directory/${member.id}`}>
            <Card className="h-full p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <MemberAvatar
                  member={member}
                  className="size-12 border border-border"
                  fallbackClassName="font-heading text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-heading truncate text-sm font-semibold text-foreground">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.classification}
                  </p>
                  {member.status !== "active" && (
                    <StatusBadge
                      tone={member.status === "honorary" ? "violet" : "neutral"}
                      className="mt-1.5"
                    >
                      {member.status === "honorary" ? "Honorary" : "Inactive"}
                    </StatusBadge>
                  )}
                </div>
              </div>
              {member.committees.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.committees.map((c) => (
                    <StatusBadge key={c} tone="sky">
                      {c}
                    </StatusBadge>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Member since {formatDate(member.joinDate, { year: "numeric", month: "long", day: undefined })}
              </p>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No members match your search.
          </p>
        )}
      </div>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
