import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { LogMakeupDialog } from "./log-makeup-dialog";
import { formatDate } from "@/lib/format";
import type { AttendanceSummary } from "@/lib/data/attendance";

export function AttendanceSummaryCard({
  memberId,
  summary,
}: {
  memberId: string;
  summary: AttendanceSummary;
}) {
  const pct = summary.percentage;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Attendance — {summary.rotaryYearLabel}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Bylaws require at least 50% of meetings held this Rotary year.
            </p>
          </div>
          {pct !== null && (
            <StatusBadge tone={summary.meetsBylaws ? "grass" : "cardinal"} className="shrink-0">
              {summary.meetsBylaws ? "Meeting bylaws" : "Below 50%"}
            </StatusBadge>
          )}
        </div>

        <div>
          <p className="font-heading text-4xl font-semibold text-foreground">
            {pct === null ? "—" : `${Math.round(pct * 100)}%`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.meetingsAttended} attended
            {summary.makeupsCount > 0 &&
              ` + ${summary.makeupsCount} makeup${summary.makeupsCount === 1 ? "" : "s"}`}{" "}
            of {summary.meetingsHeld} meeting{summary.meetingsHeld === 1 ? "" : "s"} held
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Makeups logged</p>
            <LogMakeupDialog memberId={memberId} />
          </div>
          {summary.makeups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None logged this Rotary year.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {summary.makeups.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.clubOrEvent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.attendedOn)}
                    </p>
                  </div>
                  <StatusBadge
                    tone={m.clubrunnerLogged ? "grass" : "sky"}
                    className="shrink-0"
                  >
                    {m.clubrunnerLogged ? "In ClubRunner" : "Pending"}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
