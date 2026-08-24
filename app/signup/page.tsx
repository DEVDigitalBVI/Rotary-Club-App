import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <AuthHeader label="Member Portal" />

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your secretary adds new members to the roster first — once
              you&apos;re on it, set a password here to sign in.
            </p>

            <SignupForm />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
