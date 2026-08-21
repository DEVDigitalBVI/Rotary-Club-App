"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type AuthFormState } from "@/app/login/actions";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    updatePassword,
    undefined
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Client-side only — the action itself only enforces length, since that's
  // the one rule the server needs to re-check regardless of what the form did.
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && (
          <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
        )}
      </div>

      <Button
        size="lg"
        type="submit"
        disabled={pending || mismatch || password.length < 8}
        className="mt-2 font-heading w-full"
      >
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
