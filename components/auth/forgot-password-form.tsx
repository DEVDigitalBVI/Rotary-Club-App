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
    <form action={action} className="mt-6 flex flex-col gap-5">
      {state?.error && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm leading-5 text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="rounded-xl border border-border bg-muted p-4 text-sm leading-5 text-foreground">
          {state.success}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="font-label text-[0.75rem] text-foreground/75">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="h-12 px-4"
        />
      </div>

      <Button size="lg" type="submit" disabled={pending} className="h-12 w-full rounded-xl text-base">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
