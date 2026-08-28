"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthFormState } from "@/app/login/actions";

export function LoginForm({
  checkEmail,
}: {
  checkEmail?: "signup" | "reset";
}) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined
  );

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {checkEmail === "signup" && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm leading-5 text-foreground">
          If that address can be registered, check your email to confirm it,
          then sign in below.
        </p>
      )}
      {checkEmail === "reset" && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm leading-5 text-foreground">
          If that email is on our roster, we&apos;ve sent a link to reset your
          password.
        </p>
      )}
      {state?.error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="font-label text-[0.62rem] text-foreground/70">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          className="h-12 rounded-xl border-border bg-card px-4 shadow-sm focus-visible:ring-2"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="font-label text-[0.62rem] text-foreground/70">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="h-12 rounded-xl border-border bg-card px-4 shadow-sm focus-visible:ring-2"
        />
      </div>

      <Button size="lg" type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full bg-[var(--nav-surface)] text-sm font-bold text-white shadow-[0_12px_30px_-16px_rgba(13,49,91,.85)] hover:bg-[var(--feature-surface)] dark:bg-primary dark:text-primary-foreground">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Joining the portal for the first time?{" "}
        <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
