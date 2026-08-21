import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EditProfileDialog } from "@/components/directory/edit-profile-dialog";
import { MemberAdminMenu } from "@/components/directory/member-admin-menu";
import { RecognitionCard } from "@/components/directory/recognition-card";
import {
  members,
  currentMember,
  committeesForMember,
  positionLabel,
  foundationRecognition,
  canEditRecognition,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = members.find((m) => m.id === id);
  if (!member) notFound();

  const isSelf = member.id === currentMember.id;
  const memberCommittees = committeesForMember(member.id);
  const office = positionLabel(member.position);
  const isAdmin = currentMember.role === "admin";

  return (
    <div className="p-4 sm:p-8">
      <Link
        href="/directory"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to directory
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <MemberAvatar
              member={member}
              className="size-20"
              fallbackClassName="font-heading text-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-xl font-semibold text-foreground">
                  {member.name}
                </h1>
                {office && <StatusBadge tone="gold">{office}</StatusBadge>}
                {member.status !== "active" && (
                  <StatusBadge tone={member.status === "honorary" ? "violet" : "neutral"}>
                    {member.status === "honorary" ? "Honorary" : "Inactive"}
                  </StatusBadge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {member.classification}
              </p>
              {memberCommittees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {memberCommittees.map((committee) => (
                    <StatusBadge
                      key={committee.id}
                      tone={committee.directorId === member.id ? "violet" : "sky"}
                    >
                      {committee.name}
                      {committee.directorId === member.id && " · Director"}
                    </StatusBadge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {(isSelf || isAdmin) && <EditProfileDialog member={member} />}
              {isAdmin && !isSelf && <MemberAdminMenu member={member} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Contact
            </h2>
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
            >
              <Mail className="size-4 text-muted-foreground" />
              {member.email}
            </a>
            <a
              href={`tel:${member.phone}`}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
            >
              <Phone className="size-4 text-muted-foreground" />
              {member.phone}
            </a>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              Member since {formatDate(member.joinDate, { year: "numeric", month: "long", day: undefined })}
            </div>
          </CardContent>
        </Card>

        <RecognitionCard
          member={member}
          recognition={foundationRecognition(member)}
          canEdit={canEditRecognition(currentMember)}
        />

        {member.bio && (
          <Card className="lg:col-span-3">
            <CardContent>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                About
              </h2>
              <p className="font-body mt-2 text-sm leading-relaxed text-foreground">
                {member.bio}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
