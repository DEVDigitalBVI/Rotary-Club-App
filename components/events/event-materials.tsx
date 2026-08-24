"use client";

import { useRef, useState, useTransition } from "react";
import {
  Download,
  FileText,
  Image as ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { EventAgenda, EventFlyer } from "@/lib/mock-data";
import {
  removeEventAgendaAction,
  removeEventFlyerAction,
  uploadEventAgendaAction,
  uploadEventFlyerAction,
} from "@/app/(app)/events/actions";

/**
 * Flyer and agenda for one event, backed by Supabase Storage. Deliberately
 * holds no local "current" copy of flyer/agenda — an upload or removal calls
 * a server action that revalidates this route, and the fresh value comes
 * back down as props, same as every other server-backed mutation in the app.
 */
export function EventMaterials({
  eventId,
  flyer,
  agenda,
  canManage,
  showAgenda,
}: {
  eventId: string;
  flyer?: EventFlyer;
  agenda?: EventAgenda;
  canManage: boolean;
  /** Agendas belong to meetings still to come; past ones only keep a record. */
  showAgenda: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const flyerInputRef = useRef<HTMLInputElement>(null);
  const agendaInputRef = useRef<HTMLInputElement>(null);

  function handleFlyer(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("flyer", file);
    startTransition(async () => {
      const result = await uploadEventFlyerAction(eventId, formData);
      if (result?.error) setError(result.error);
    });
  }

  function removeFlyer() {
    setError(null);
    startTransition(async () => {
      const result = await removeEventFlyerAction(eventId);
      if (result?.error) setError(result.error);
    });
  }

  function handleAgenda(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("agenda", file);
    startTransition(async () => {
      const result = await uploadEventAgendaAction(eventId, formData);
      if (result?.error) setError(result.error);
    });
  }

  function removeAgenda() {
    setError(null);
    startTransition(async () => {
      const result = await removeEventAgendaAction(eventId);
      if (result?.error) setError(result.error);
    });
  }

  // Members with nothing to see and no ability to add shouldn't get an
  // empty card telling them so.
  if (!canManage && !flyer && !agenda) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Materials
        </h2>

        {error && (
          <p className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </p>
        )}

        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Flyer</p>
          {flyer ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flyer.url}
                alt={flyer.alt}
                className="w-full rounded-lg border border-border"
              />
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-heading"
                    disabled={pending}
                    onClick={() => flyerInputRef.current?.click()}
                  >
                    <Upload />
                    Replace
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-heading text-muted-foreground"
                    disabled={pending}
                    onClick={removeFlyer}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                </div>
              )}
            </>
          ) : canManage ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => flyerInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-muted"
            >
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="font-heading text-sm font-medium text-foreground">
                Upload flyer
              </span>
              <span className="text-xs text-muted-foreground">
                The poster members will see and share
              </span>
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">No flyer posted.</p>
          )}
          <input
            ref={flyerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFlyer}
          />
        </section>

        {(showAgenda || agenda) && (
          <section className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Agenda</p>
            {agenda ? (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {agenda.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDate(agenda.uploadedAt)}
                    {agenda.sizeLabel && ` · ${agenda.sizeLabel}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Download agenda"
                  nativeButton={false}
                  render={
                    <a
                      href={agenda.url}
                      download={agenda.fileName}
                      target="_blank"
                      rel="noreferrer noopener"
                    />
                  }
                >
                  <Download />
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove agenda"
                    className="text-muted-foreground"
                    disabled={pending}
                    onClick={removeAgenda}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            ) : canManage ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => agendaInputRef.current?.click()}
                className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3 text-left transition-colors hover:bg-muted"
              >
                <Upload className="size-5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-heading block text-sm font-medium text-foreground">
                    Upload agenda
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF or Word document
                  </span>
                </span>
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                No agenda posted yet.
              </p>
            )}
            <input
              ref={agendaInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={handleAgenda}
            />
          </section>
        )}
      </CardContent>
    </Card>
  );
}
