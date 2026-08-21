import Link from "next/link";
import { AuthHeader } from "@/components/auth/auth-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <AuthHeader label="Member Portal" />

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Reset your password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the email your club has on file and we&apos;ll send you a
              link to set a new password.
            </p>

            <ForgotPasswordForm />

            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
