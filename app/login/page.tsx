import { AuthHeader } from "@/components/auth/auth-header";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <AuthHeader label="Member Portal" />

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-xl bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This app is for club members only. Use the email your club has
              on file.
            </p>

            <LoginForm
              checkEmail={
                params["check-email"] === "1"
                  ? "signup"
                  : params["check-email"] === "reset"
                    ? "reset"
                    : undefined
              }
            />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact your club secretary.
          </p>
        </div>
      </div>
    </div>
  );
}
