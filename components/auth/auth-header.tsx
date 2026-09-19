export function AuthHeader({ label }: { label: string }) {
  return (
    <header className="relative flex aspect-[3/2] max-h-[min(40rem,42dvh)] min-h-40 shrink-0 flex-col overflow-hidden mask-fade-b sm:min-h-52 lg:mx-auto lg:mt-10 lg:max-h-[40rem] lg:max-w-3xl lg:rounded-2xl lg:shadow-[var(--shadow-card)] lg:mask-fade-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-header-photo.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[65%_10%] sm:object-[58%_10%] lg:object-[50%_9%]"
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
      <div className="relative flex items-start justify-between gap-3 px-3 pt-[max(.75rem,env(safe-area-inset-top))] min-[360px]:px-4 sm:items-center sm:px-6 sm:pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rotary-club-logo.png"
          alt="Rotary Club of Road Town"
        className="h-auto w-[min(11rem,58vw)] drop-shadow-sm sm:w-52"
        />
        <p className="max-w-[38%] pt-2 text-right font-heading text-sm font-semibold leading-tight text-white/90 drop-shadow-sm min-[360px]:text-base sm:max-w-none sm:pt-1 sm:text-[1.3rem]">
          {label}
        </p>
      </div>
    </header>
  );
}
