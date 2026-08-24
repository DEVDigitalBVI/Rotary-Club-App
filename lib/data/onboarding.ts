import { createClient } from "@/lib/supabase/server";
import { throwOnSupabaseError } from "@/lib/supabase/errors";

export const onboardingTasks = [
  { key: "profile", title: "Complete your member profile", detail: "Add your contact details, classification, and a short introduction." },
  { key: "directory", title: "Explore the club directory", detail: "Meet the people serving alongside you." },
  { key: "committee", title: "Choose a committee", detail: "Find the part of Rotary where your skills can have the most impact." },
  { key: "first-event", title: "RSVP to your first event", detail: "Join an upcoming meeting or fellowship activity." },
  { key: "first-project", title: "Join a service project", detail: "Turn fellowship into action in the community." },
] as const;
export type OnboardingKey = typeof onboardingTasks[number]["key"];

export async function getCompletedOnboarding(memberId: string): Promise<OnboardingKey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("member_onboarding").select("task_key").eq("member_id", memberId).returns<{ task_key: OnboardingKey }[]>();
  throwOnSupabaseError(error, "Unable to load onboarding progress");
  return (data ?? []).map((row) => row.task_key);
}
