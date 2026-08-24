import { PartyPopper, Cake } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import type { Member } from "@/lib/mock-data";

function formatNames(names: string[]) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/**
 * Home screen birthday recognition. The member whose birthday it is gets a
 * big personal card; everyone else just sees an announcement naming who's
 * celebrating today. Renders nothing on a day with no birthdays on file.
 */
export function BirthdayBanner({
  viewerId,
  birthdays,
}: {
  viewerId: string | undefined;
  birthdays: Member[];
}) {
  if (birthdays.length === 0) return null;

  const self = birthdays.find((m) => m.id === viewerId);
  const others = birthdays.filter((m) => m.id !== viewerId);

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 sm:px-8 sm:pt-8">
      {self && (
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-7 text-center sm:px-8 sm:py-9"
          style={{
            background:
              "linear-gradient(135deg, var(--rotary-gold), var(--rotary-orange) 55%, var(--rotary-cranberry))",
          }}
        >
          <PartyPopper className="mx-auto size-8 text-white" />
          <p className="font-heading mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Happy Birthday, {self.name.split(" ")[0]}!
          </p>
          <p className="mt-1 text-sm text-white/90">
            The whole club is wishing you a great one today.
          </p>
        </div>
      )}

      {others.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Cake className="size-5 shrink-0" style={{ color: "var(--rotary-cranberry)" }} />
          <div className="flex -space-x-2">
            {others.map((m) => (
              <MemberAvatar
                key={m.id}
                member={m}
                className="size-8 border-2 border-card"
                fallbackClassName="text-[0.65rem]"
              />
            ))}
          </div>
          <p className="text-sm text-foreground">
            <span className="font-medium">
              {formatNames(others.map((m) => m.name.split(" ")[0]))}
            </span>{" "}
            {others.length === 1 ? "has" : "have"} a birthday today — wish them well!
          </p>
        </div>
      )}
    </div>
  );
}
