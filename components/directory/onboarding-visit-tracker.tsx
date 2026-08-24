"use client";

import { useEffect, useTransition } from "react";
import { recordOnboardingTaskAction } from "@/app/(app)/onboarding/actions";

export function OnboardingVisitTracker() {
  const [, startTransition] = useTransition();
  useEffect(() => {
    startTransition(async () => {
      try {
        await recordOnboardingTaskAction("directory");
      } catch (error) {
        console.error("Unable to record the directory onboarding visit", error);
      }
    });
  }, []);
  return null;
}
