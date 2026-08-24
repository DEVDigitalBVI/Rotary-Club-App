"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/data/members";
import { onboardingTasks, type OnboardingKey } from "@/lib/data/onboarding";

export async function setOnboardingTaskAction(taskKey: OnboardingKey, completed: boolean) {
  if (!onboardingTasks.some((task) => task.key === taskKey)) throw new Error("Unknown onboarding task.");
  const member = await getCurrentMember();
  if (!member) throw new Error("You must be signed in.");
  const supabase = await createClient();
  const result = completed
    ? await supabase.from("member_onboarding").upsert({ member_id: member.id, task_key: taskKey })
    : await supabase.from("member_onboarding").delete().eq("member_id", member.id).eq("task_key", taskKey);
  if (result.error) throw new Error("Unable to update onboarding progress.", { cause: result.error });
  revalidatePath("/dashboard");
}
