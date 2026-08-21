import Link from "next/link";
import { Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "@/components/member-avatar";
import { StatusBadge } from "@/components/status-badge";
import type {
  Committee,
  CommitteeManageRight,
  Member,
} from "@/lib/mock-data";

export function CommitteeCard({
  committee,
  members,
  manageRight,
  onManage,
}: {
  committee: Committee;
  members: Member[];
  manageRight: CommitteeManageRight;
  onManage: () => void;
}) {
  const byId = new Map(members.map((m) => [m.id, m]));
  const director = committee.directorId ? byId.get(committee.directorId) : undefined;
  // The director is listed separately above, so keep them out of the stack.
  const roster = committee.memberIds
    .filter((id) => id !== committee.directorId)
    .map((id) => byId.get(id))
    .filter((m): m is Member => Boolean(m));

  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            {committee.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {committee.description}
          </p>
        </div>
        {manageRight === "director" && (
          <StatusBadge tone="gold" className="shrink-0">
            You direct
          </StatusBadge>
        )}
      </div>

      {!director && (
        <p className="rounded-lg border border-dashed border-border p-2.5 text-xs text-muted-foreground">
          Chaired by the President. Members are added by the President or
          Secretary.
        </p>
      )}

      {director && (
        <Link
          href={`/directory/${director.id}`}
          className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted"
        >
          <MemberAvatar
            member={director}
            className="size-9 shrink-0"
            fallbackClassName="text-xs"
          />
          <div className="min-w-0">
            <p className="font-heading truncate text-sm font-medium text-foreground">
              {director.name}
            </p>
            <p className="text-xs text-muted-foreground">Director</p>
          </div>
        </Link>
      )}

      <div className="flex flex-1 flex-col justify-end gap-3">
        <div className="flex items-center gap-2">
          {roster.length > 0 ? (
            <div className="flex -space-x-2">
              {roster.slice(0, 6).map((member) => (
                <MemberAvatar
                  key={member.id}
                  member={member}
                  className="size-8 border-2 border-card"
                  fallbackClassName="text-[0.65rem]"
                />
              ))}
            </div>
          ) : (
            <Users className="size-4 text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground">
            {committee.memberIds.length}{" "}
            {committee.memberIds.length === 1 ? "member" : "members"}
            {roster.length > 6 && ` · +${roster.length - 6} more`}
          </p>
        </div>

        {manageRight && (
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="font-heading w-full"
              onClick={onManage}
            >
              <Settings2 />
              Manage members
            </Button>
            {manageRight === "officer" && committee.directorId && (
              <p className="text-center text-xs text-muted-foreground">
                You can edit this as a club officer.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
