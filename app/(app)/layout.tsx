import { AppShell } from "@/components/app-shell/app-shell";
import { getCurrentMember } from "@/lib/data/members";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) {
    redirect("/login");
  }
  if (member.status === "inactive") {
    redirect("/access-denied");
  }

  return <AppShell>{children}</AppShell>;
}
