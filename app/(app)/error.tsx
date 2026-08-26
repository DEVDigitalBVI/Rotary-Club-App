"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-3xl items-center px-4 py-12 sm:px-8">
      <EmptyState
        icon={AlertCircle}
        title="This page couldn’t load"
        description="Your information is safe. Check your connection and try again. If the problem continues, return to the page later."
        className="w-full border-solid bg-card"
        action={<Button type="button" onClick={reset}><RefreshCw />Try again</Button>}
      />
    </main>
  );
}
