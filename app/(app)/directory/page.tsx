import { PageHeader } from "@/components/page-header";
import { MemberDirectory } from "@/components/directory/member-directory";
import { getMembers, getCurrentMember } from "@/lib/data/members";
import { getCommittees } from "@/lib/data/committees";
import { OnboardingVisitTracker } from "@/components/directory/onboarding-visit-tracker";

export default async function DirectoryPage() {
  const [members, committees, currentMember] = await Promise.all([
    getMembers(),
    getCommittees(),
    getCurrentMember(),
  ]);

  return (
    <div>
      {currentMember && <OnboardingVisitTracker />}
      <PageHeader
        title="Directory"
        description="Find fellow members and see who's on which committee."
      />
      {currentMember ? (
        <MemberDirectory
          members={members}
          committees={committees}
          currentMember={currentMember}
        />
      ) : (
        <p className="p-4 text-sm text-muted-foreground sm:p-8">
          Your account isn&apos;t linked to a member profile yet.
        </p>
      )}
    </div>
  );
}
