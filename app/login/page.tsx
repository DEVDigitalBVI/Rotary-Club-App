import Image from "next/image";
import { ArrowDown, MapPin } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-dvh bg-[#f3f0e9] text-[#172b3f] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,.92fr)] dark:bg-background dark:text-foreground">
      <section className="relative min-h-[21rem] overflow-hidden bg-[#0d315b] lg:sticky lg:top-0 lg:h-dvh">
        <Image
          src="/login-header-photo.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-[50%_18%] lg:object-[50%_28%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,30,55,.18)_5%,rgba(7,30,55,.08)_42%,rgba(7,30,55,.92)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(0,103,200,.16),transparent_52%,rgba(247,168,27,.08))]" />

        <div className="relative flex h-full min-h-[21rem] flex-col justify-between p-5 sm:p-8 lg:p-12">
          <div className="rise-in flex items-start justify-between gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rotary-club-logo.png" alt="Rotary Club of Road Town" className="h-auto w-48 drop-shadow-md sm:w-60" />
            <span className="font-label rounded-full border border-white/20 bg-[#0d315b]/25 px-3 py-1.5 text-[0.56rem] text-white/75 backdrop-blur-md">Member house</span>
          </div>

          <div className="rise-in rise-in-delay-1 hidden max-w-xl text-white lg:block">
            <p className="font-label mb-4 text-[0.65rem] text-[var(--rotary-gold)]">People of action</p>
            <h1 className="font-heading text-6xl font-semibold leading-[0.94] tracking-[-0.045em] xl:text-7xl">Where service<br />meets fellowship.</h1>
            <div className="mt-7 flex items-center gap-3 border-t border-white/20 pt-5 text-sm text-white/66">
              <MapPin className="size-4 text-[var(--rotary-gold)]" />
              Road Town, Tortola · British Virgin Islands
            </div>
          </div>

          <div className="flex items-end justify-between text-white lg:hidden">
            <div>
              <p className="font-label mb-2 text-[0.55rem] text-[var(--rotary-gold)]">People of action</p>
              <h1 className="font-heading text-4xl font-semibold leading-none">Welcome home.</h1>
            </div>
            <ArrowDown className="mb-1 size-5 text-white/60" />
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[38rem] items-center justify-center px-5 py-12 sm:px-10 lg:min-h-dvh lg:px-14 xl:px-20">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <ThemeToggle className="border border-border bg-card/70 hover:bg-card" />
        </div>
        <div className="rise-in rise-in-delay-2 w-full max-w-md">
          <p className="font-label text-[0.62rem] text-primary/65">Private member portal</p>
          <h2 className="font-heading mt-3 text-4xl font-semibold leading-[1.02] sm:text-5xl">Sign in to your<br />club community.</h2>
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">Events, fellowship, club news, service projects, and your membership—all in one place.</p>

          <LoginForm
            checkEmail={
              params["check-email"] === "1"
                ? "signup"
                : params["check-email"] === "reset"
                  ? "reset"
                  : undefined
            }
          />

          <div className="mt-10 flex items-center justify-between border-t border-border pt-5 text-[0.68rem] text-muted-foreground">
            <span>Rotary Club of Road Town</span>
            <span>Est. 1991</span>
          </div>
        </div>
      </section>
    </main>
  );
}
