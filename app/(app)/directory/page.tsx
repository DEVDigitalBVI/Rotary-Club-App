import { PageHeader } from "@/components/page-header";
import { MemberDirectory } from "@/components/directory/member-directory";
import { members, committees, currentMember } from "@/lib/mock-data";

export default function DirectoryPage() {
  return (
    <div>
      <PageHeader
        title="Directory"
        description="Find fellow members and see who's on which committee."
      />
      <MemberDirectory
        members={members}
        committees={committees}
        currentMember={currentMember}
      />
    </div>
  );
}
