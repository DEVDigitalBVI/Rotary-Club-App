"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type AuthFormState } from "@/app/login/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordReset,
    undefined
  );

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <Button size="lg" type="submit" disabled={pending} className="mt-2 font-heading w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
