import { AuthHeader } from "@/components/auth/auth-header";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <AuthHeader label="Member Portal" />

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Set a new password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>

            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
