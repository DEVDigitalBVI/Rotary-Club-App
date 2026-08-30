import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";
import { getMissingMemberProfileFields } from "@/lib/member-profile";

export const onboardingTasks = [
  { key: "profile", href: "/directory", title: "Complete your member profile", detail: "Add your phone, classification, and a short introduction." },
  { key: "directory", href: "/directory", title: "Explore the club directory", detail: "Meet the people serving alongside you." },
  { key: "committee", href: "/directory", title: "Choose a committee", detail: "Find the part of Rotary where your skills can have the most impact." },
  { key: "first-event", href: "/events", title: "RSVP to your first event", detail: "Join an upcoming meeting or fellowship activity." },
  { key: "first-project", href: "/projects", title: "Join a service project", detail: "Turn fellowship into action in the community." },
] as const;
export type OnboardingTask = typeof onboardingTasks[number];
export type OnboardingKey = typeof onboardingTasks[number]["key"];

export function getOnboardingTaskHref(task: OnboardingTask, memberId: string) {
  return task.key === "profile"
    ? `/directory/${memberId}?edit=profile`
    : task.href;
}

export async function getCompletedOnboarding(memberId: string): Promise<OnboardingKey[]> {
  const supabase = await createClient();
  const [recorded, member, committees, rsvps, projects] = await Promise.all([
    supabase.from("member_onboarding").select("task_key").eq("member_id", memberId).returns<{ task_key: OnboardingKey }[]>(),
    supabase.from("members").select("phone, classification, bio").eq("id", memberId).maybeSingle<{ phone: string | null; classification: string | null; bio: string | null }>(),
    supabase.from("committee_members").select("committee_id").eq("member_id", memberId).limit(1),
    supabase.from("event_rsvps").select("event_id").eq("member_id", memberId).limit(1),
    supabase.from("project_volunteers").select("project_id").eq("member_id", memberId).limit(1),
  ]);
  [recorded.error, member.error, committees.error, rsvps.error, projects.error].forEach((error) => throwOnSupabaseError(error, "Unable to load onboarding progress"));

  const completed = new Set<OnboardingKey>((recorded.data ?? []).map((row) => row.task_key));
  if (getMissingMemberProfileFields(member.data).length === 0) completed.add("profile");
  if ((committees.data?.length ?? 0) > 0) completed.add("committee");
  if ((rsvps.data?.length ?? 0) > 0) completed.add("first-event");
  if ((projects.data?.length ?? 0) > 0) completed.add("first-project");
  return [...completed];
}
