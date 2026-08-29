"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, DatabaseZap, Settings2, UserPlus, SearchX } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchField } from "@/components/ui/search-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { AddMemberDialog } from "@/components/directory/add-member-dialog";
import { CommitteeCard } from "@/components/directory/committee-card";
import { ManageCommitteeDialog } from "@/components/directory/manage-committee-dialog";
import { AssignDirectorDialog } from "@/components/directory/assign-director-dialog";
import { StartNewRotaryYearDialog } from "@/components/directory/start-new-rotary-year-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLinkItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";
import {
  canAddMembers,
  canAssignRoles,
  committeeManageRight,
  committeesForMember,
  positionLabel,
  actionGroupsByArea,
  foundationRecognition,
  paulHarrisLabel,
  type Committee,
  type Member,
} from "@/lib/mock-data";

/**
 * `all`, `phf`, `polioplus`, or `ag:<group name>`. Encoded in one string so
 * the whole thing fits a single Select rather than sprawling into three
 * controls that are almost never used together.
 */
function matchesRecognition(member: Member, filter: string) {
  if (filter === "all") return true;
  const recognition = foundationRecognition(member);
  if (filter === "phf") return recognition.paulHarrisCount > 0;
  if (filter === "polioplus") return recognition.polioPlusSociety;
  if (filter.startsWith("ag:")) {
    return recognition.actionGroups.includes(filter.slice(3));
  }
  return true;
}

export function MemberDirectory({
  members,
  committees,
  currentMember,
}: {
  members: Member[];
  committees: Committee[];
  currentMember: Member;
}) {
  const [query, setQuery] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState("all");
  // One control covers all three kinds of Foundation recognition. The
  // Foundation director's real need is a list they can act on — "who is in the
  // PolioPlus Society" — which a per-profile view can't answer.
  const [recognitionFilter, setRecognitionFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [managing, setManaging] = useState<Committee | null>(null);
  const [assigningDirectorFor, setAssigningDirectorFor] = useState<Committee | null>(
    null
  );
  const [startingNewYear, setStartingNewYear] = useState(false);

  const mayAddMembers = canAddMembers(currentMember, committees);
  const mayAssignRoles = canAssignRoles(currentMember);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery =
        q.length === 0 ||
        member.name.toLowerCase().includes(q) ||
        member.classification.toLowerCase().includes(q);
      const matchesCommittee =
        committeeFilter === "all" ||
        committees.some(
          (committee) =>
            committee.id === committeeFilter &&
            committee.memberIds.includes(member.id)
        );
      return (
        matchesQuery &&
        matchesCommittee &&
        matchesRecognition(member, recognitionFilter)
      );
    });
  }, [members, query, committeeFilter, recognitionFilter, committees]);

  const committeeFilterLabel = (value: string) =>
    committees.find((committee) => committee.id === value)?.name ??
    "All committees";

  const recognitionFilterLabel = (value: string) => {
    if (value === "phf") return "Paul Harris Fellows";
    if (value === "polioplus") return "PolioPlus Society";
    if (value.startsWith("ag:")) return value.slice(3);
    return "Any recognition";
  };

  const filtersActive =
    query.trim().length > 0 ||
    committeeFilter !== "all" ||
    recognitionFilter !== "all";

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 sm:p-8">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="committees">
            Committees ({committees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4 flex flex-col gap-4">
          {/* Labelled individually: once a filter is set, a bare trigger reading
              "Membership" or "Peace" gives no clue which axis it narrowed. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="flex flex-col gap-1.5 sm:max-w-xs sm:flex-1">
                <Label htmlFor="directory-search">Search</Label>
                <SearchField id="directory-search" aria-label="Search members" placeholder="Search by name or classification" value={query} onValueChange={setQuery} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="directory-committee">Committee</Label>
                <Select
                  value={committeeFilter}
                  onValueChange={(v) => setCommitteeFilter(v as string)}
                >
                  <SelectTrigger
                    id="directory-committee"
                    className="w-full sm:w-52"
                  >
                    <SelectValue>{committeeFilterLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All committees</SelectItem>
                    {committees.map((committee) => (
                      <SelectItem key={committee.id} value={committee.id}>
                        {committee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="directory-recognition">
                  Foundation recognition
                </Label>
                <Select
                  value={recognitionFilter}
                  onValueChange={(v) => setRecognitionFilter(v as string)}
                >
                  <SelectTrigger
                    id="directory-recognition"
                    className="w-full sm:w-56"
                  >
                    <SelectValue>{recognitionFilterLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any recognition</SelectItem>
                    <SelectItem value="phf">Paul Harris Fellows</SelectItem>
                    <SelectItem value="polioplus">PolioPlus Society</SelectItem>
                    {actionGroupsByArea.map((entry) => (
                      <SelectGroup key={entry.area}>
                        <SelectSeparator />
                        <SelectLabel className="font-heading pt-2 text-[0.7rem] text-foreground">
                          {entry.area}
                        </SelectLabel>
                        {entry.groups.map((group) => (
                          <SelectItem key={group} value={`ag:${group}`}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(mayAddMembers || mayAssignRoles) && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" className="font-heading" />}>
                  <Settings2 />Admin tools
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  {mayAddMembers && <DropdownMenuItem onClick={() => setAddOpen(true)}><UserPlus />Add one member</DropdownMenuItem>}
                  {mayAddMembers && <DropdownMenuLinkItem render={<Link href="/admin/clubrunner" />}><DatabaseZap />ClubRunner import</DropdownMenuLinkItem>}
                  {mayAddMembers && mayAssignRoles && <DropdownMenuSeparator />}
                  {mayAssignRoles && <DropdownMenuItem onClick={() => setStartingNewYear(true)}><CalendarClock />Start new Rotary year</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm text-muted-foreground">
              {filtered.length} of {members.length} members
            </p>
            {filtersActive && (
              <Button
                variant="link"
                size="sm"
                className="font-heading h-auto p-0"
                onClick={() => {
                  setQuery("");
                  setCommitteeFilter("all");
                  setRecognitionFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member) => {
              const memberCommittees = committeesForMember(member.id, committees);
              const office = positionLabel(member.position);
              // Compact here; the profile carries the full recognition detail.
              const recognition = foundationRecognition(member);
              const phf = paulHarrisLabel(recognition.paulHarrisCount, true);
              return (
                <Link key={member.id} href={`/directory/${member.id}`}>
                  <Card className="h-full p-4 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
                    <div className="flex items-start gap-3">
                      <MemberAvatar
                        member={member}
                        className="size-12"
                        fallbackClassName="font-heading text-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-heading truncate text-sm font-semibold text-foreground">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.classification}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {office && (
                            <StatusBadge tone="gold">{office}</StatusBadge>
                          )}
                          {phf && <StatusBadge tone="grass">{phf}</StatusBadge>}
                          {recognition.polioPlusSociety && (
                            <StatusBadge tone="cardinal">PolioPlus</StatusBadge>
                          )}
                          {member.status !== "active" && (
                            <StatusBadge
                              tone={
                                member.status === "honorary" ? "violet" : "neutral"
                              }
                            >
                              {member.status === "honorary"
                                ? "Honorary"
                                : "Inactive"}
                            </StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>
                    {memberCommittees.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {memberCommittees.map((committee) => (
                          <StatusBadge
                            key={committee.id}
                            tone={
                              committee.directorId === member.id ? "violet" : "sky"
                            }
                          >
                            {committee.name}
                            {committee.directorId === member.id && " · Director"}
                          </StatusBadge>
                        ))}
                      </div>
                    )}
                    {member.joinDate && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Member since{" "}
                        {formatDate(member.joinDate, {
                          year: "numeric",
                          month: "long",
                          day: undefined,
                        })}
                      </p>
                    )}
                  </Card>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <EmptyState
                icon={SearchX}
                title="No members found"
                description="Try a different name or classification, or clear the active filters to see the full directory."
                action={filtersActive ? <Button type="button" variant="outline" onClick={() => { setQuery(""); setCommitteeFilter("all"); setRecognitionFilter("all"); }}>Clear filters</Button> : undefined}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="committees" className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Five standing committees, each led by a director, plus the Board.
            Directors manage their own committee&apos;s roster; the President
            and Secretary can step in on any of them.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {committees.map((committee) => (
              <CommitteeCard
                key={committee.id}
                committee={committee}
                members={members}
                manageRight={committeeManageRight(currentMember, committee)}
                onManage={() => setManaging(committee)}
                onAssignDirector={() => setAssigningDirectorFor(committee)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} />

      <ManageCommitteeDialog
        committee={managing}
        members={members}
        manageRight={
          managing ? committeeManageRight(currentMember, managing) : null
        }
        open={managing !== null}
        onOpenChange={(next) => {
          if (!next) setManaging(null);
        }}
      />

      <AssignDirectorDialog
        committee={assigningDirectorFor}
        members={members}
        open={assigningDirectorFor !== null}
        onOpenChange={(next) => {
          if (!next) setAssigningDirectorFor(null);
        }}
      />

      <StartNewRotaryYearDialog
        members={members}
        open={startingNewYear}
        onOpenChange={setStartingNewYear}
      />
    </div>
  );
}
