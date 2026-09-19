import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-muted/40">
      <AuthHeader label="Member Portal" />

      <div className="flex flex-1 items-start justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:items-center sm:px-6 sm:py-12">
        <div className="w-full max-w-sm">
          <section aria-labelledby="forgot-password-title" className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] min-[360px]:p-6 sm:p-8">
            <h1 id="forgot-password-title" className="font-heading text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
              Reset your password
            </h1>
            <p className="mt-2 text-base leading-6 text-muted-foreground">
              Enter the email your club has on file and we&apos;ll send you a
              link to set a new password.
            </p>

            <ForgotPasswordForm />

            <p className="mt-5 text-center text-sm text-muted-foreground">
              <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 font-semibold text-primary underline-offset-4 hover:bg-muted hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                Back to sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
