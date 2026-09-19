import { MapPin } from "lucide-react";
import { AuthHeader } from "@/components/auth/auth-header";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-dvh bg-[#f3f0e9] text-[#172b3f] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,.92fr)] dark:bg-background dark:text-foreground">
      <div className="lg:hidden">
        <AuthHeader label="Member Portal" />
      </div>

      <section className="relative hidden h-dvh overflow-hidden bg-[var(--nav-surface)] lg:sticky lg:top-0 lg:flex lg:flex-col">
        <div className="rise-in flex h-32 shrink-0 items-center justify-between gap-5 px-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rotary-club-logo.png"
            alt="Rotary Club of Road Town"
            className="-ml-6 h-auto w-60"
          />
          <span className="font-label rounded-full border border-white/18 px-3 py-1.5 text-[0.56rem] text-white/65">
            Member house
          </span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-header-photo.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover object-[50%_30%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,30,55,.08)_5%,rgba(7,30,55,.04)_42%,rgba(7,30,55,.92)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(0,103,200,.12),transparent_52%,rgba(247,168,27,.07))]" />

          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <div className="rise-in rise-in-delay-1 max-w-xl">
              <p className="font-label mb-4 text-[0.65rem] text-[var(--rotary-gold)]">
                Secure member access
              </p>
              <h1 className="font-heading text-6xl font-semibold leading-[0.94] tracking-[-0.045em] xl:text-7xl">
                Protect your
                <br />
                club account.
              </h1>
              <div className="mt-7 flex items-center gap-3 border-t border-white/20 pt-5 text-sm text-white/66">
                <MapPin className="size-4 text-[var(--rotary-gold)]" />
                Road Town, Tortola · British Virgin Islands
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[38rem] items-center justify-center px-5 py-10 sm:px-10 sm:py-12 lg:min-h-dvh lg:px-14 xl:px-20">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <ThemeToggle className="border border-border bg-card/70 hover:bg-card" />
        </div>

        <div className="rise-in rise-in-delay-2 w-full max-w-md">
          <section aria-labelledby="update-password-title">
            <p className="font-label text-[0.62rem] text-primary/65">
              Member access
            </p>
            <h1
              id="update-password-title"
              className="font-heading mt-3 text-4xl font-semibold leading-[1.02] text-foreground sm:text-5xl"
            >
              Create your password
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Your email has been verified. Choose a password to finish setting
              up your member portal account.
            </p>

            <UpdatePasswordForm />
          </section>

          <div className="mt-10 flex items-center justify-between border-t border-border pt-5 text-[0.68rem] text-muted-foreground">
            <span>Rotary Club of Road Town</span>
            <span>Est. 1991</span>
          </div>
        </div>
      </section>
    </main>
  );
}
