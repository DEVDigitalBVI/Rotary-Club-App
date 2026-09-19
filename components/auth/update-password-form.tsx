"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Circle, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type AuthFormState } from "@/app/login/actions";
import { cn } from "@/lib/utils";
import {
  getPasswordChecks,
  meetsPasswordRequirements,
  PASSWORD_REQUIREMENTS,
} from "@/lib/password-policy";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    updatePassword,
    undefined
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const checks = getPasswordChecks(password);
  const passwordStarted = password.length > 0;
  const passwordValid = meetsPasswordRequirements(password);
  const confirmStarted = confirm.length > 0;
  const mismatch = confirm.length > 0 && password !== confirm;
  const confirmationValid = confirmStarted && password === confirm;

  const validFieldClass =
    "border-emerald-600 bg-emerald-50/60 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 dark:border-emerald-500 dark:bg-emerald-950/20";

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
          aria-describedby="password-requirements"
          aria-invalid={passwordStarted && !passwordValid}
          className={cn(passwordValid && validFieldClass)}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div
        id="password-requirements"
        className="rounded-xl border border-border bg-muted/35 p-3.5"
      >
        <p className="text-xs font-semibold text-foreground">Password requirements</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {PASSWORD_REQUIREMENTS.map((requirement) => {
            const met = checks[requirement.key];
            const RequirementIcon = met
              ? CheckCircle2
              : passwordStarted
                ? XCircle
                : Circle;

            return (
              <li
                key={requirement.key}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  met
                    ? "text-emerald-700 dark:text-emerald-300"
                    : passwordStarted
                      ? "text-destructive"
                      : "text-muted-foreground"
                )}
              >
                <RequirementIcon className="size-3.5 shrink-0" aria-hidden="true" />
                {requirement.label}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 flex items-start gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Your new password must be different from your current password.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          required
          aria-invalid={mismatch}
          aria-describedby={confirmStarted ? "confirm-password-status" : undefined}
          className={cn(confirmationValid && validFieldClass)}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirmStarted && (
          <p
            id="confirm-password-status"
            className={cn(
              "flex items-center gap-1.5 text-xs",
              confirmationValid
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-destructive"
            )}
          >
            {confirmationValid ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <XCircle className="size-3.5" aria-hidden="true" />
            )}
            {confirmationValid
              ? "Passwords match."
              : "Passwords do not match. Enter the same password in both fields."}
          </p>
        )}
      </div>

      <Button
        size="lg"
        type="submit"
        disabled={pending || !passwordValid || !confirmationValid}
        className="mt-2 font-heading w-full"
      >
        {pending ? "Saving password…" : "Set password and continue"}
      </Button>
    </form>
  );
}
