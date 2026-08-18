import { PageHeader } from "@/components/page-header";
import { MemberDirectory } from "@/components/directory/member-directory";
import { members, currentMember } from "@/lib/mock-data";

export default function DirectoryPage() {
  return (
    <div>
      <PageHeader
        title="Directory"
        description="Find fellow members and see who's on which committee."
      />
      <MemberDirectory members={members} isAdmin={currentMember.role === "admin"} />
    </div>
  );
}
