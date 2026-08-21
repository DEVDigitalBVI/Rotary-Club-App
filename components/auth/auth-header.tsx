export function AuthHeader({ label }: { label: string }) {
  return (
    <div className="relative flex aspect-[3/2] max-h-[40rem] shrink-0 flex-col overflow-hidden mask-fade-b lg:mx-auto lg:mt-10 lg:max-w-3xl lg:rounded-2xl lg:shadow-[var(--shadow-card)] lg:mask-fade-none">
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
      <div className="relative flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rotary-club-logo.png"
          alt="Rotary Club of Road Town"
          className="h-[5.5rem] w-auto drop-shadow-sm sm:h-[6.5rem]"
        />
        <p className="font-heading text-[1.14rem] text-white/90 drop-shadow-sm sm:text-[1.3rem]">
          {label}
        </p>
      </div>
    </div>
  );
}
