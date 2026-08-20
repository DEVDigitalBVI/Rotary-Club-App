import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/40">
      <div className="relative flex aspect-[3/2] max-h-[40rem] shrink-0 flex-col overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-header-photo.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[65%_10%] sm:object-[58%_10%] lg:object-[50%_10%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--rotary-blue), var(--rotary-azure) 55%, var(--rotary-turquoise))",
            opacity: 0.55,
          }}
        />
        <div className="relative flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rotary-club-logo.png"
            alt="Rotary Club of Road Town"
            className="h-[4.55rem] w-auto drop-shadow-sm sm:h-[5.2rem]"
          />
          <p className="font-heading text-[1.14rem] text-white/90 drop-shadow-sm sm:text-[1.3rem]">
            Member Portal
          </p>
        </div>
      </div>

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

            <form className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  defaultValue="jamaal.hodge@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/login"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  defaultValue="••••••••"
                />
              </div>

              <Button
                size="lg"
                className="mt-2 font-heading w-full"
                nativeButton={false}
                render={<Link href="/dashboard" />}
              >
                Sign in
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              size="lg"
              className="font-heading w-full"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Trouble signing in? Contact your club secretary.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 010-4.54V6.62H1.27a12 12 0 000 10.76l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
