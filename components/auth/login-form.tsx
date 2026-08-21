"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthFormState } from "@/app/login/actions";

export function LoginForm({ checkEmail = false }: { checkEmail?: boolean }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signIn,
    undefined
  );

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {checkEmail && (
        <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
          Account created — check your email to confirm it, then sign in below.
        </p>
      )}
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <Button size="lg" type="submit" disabled={pending} className="mt-2 font-heading w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        New to the club?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
