"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText, ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateEventMaterial } from "@/lib/event-materials";
import { createEventAction } from "@/app/(app)/events/actions";

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [flyerName, setFlyerName] = useState<string | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [agendaName, setAgendaName] = useState<string | null>(null);
  const flyerRef = useRef<HTMLInputElement>(null);
  const agendaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!flyerPreview) return;
    return () => URL.revokeObjectURL(flyerPreview);
  }, [flyerPreview]);

  function handleFlyer(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFlyerName(file.name);
    setFlyerPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setError(null);
    setFlyerName(null);
    setFlyerPreview(null);
    setAgendaName(null);
    if (flyerRef.current) flyerRef.current.value = "";
    if (agendaRef.current) agendaRef.current.value = "";
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <Button className="font-heading" onClick={() => setOpen(true)}>
        <Plus />
        Create event
      </Button>
      <DialogContent className="form-dialog overflow-hidden p-0 sm:max-w-xl" contentClassName="flex min-h-0 flex-col gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-5 pr-12">
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Members will see this on their Events tab right away.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const formData = new FormData(e.currentTarget);
            for (const kind of ["flyer", "agenda"] as const) {
              const file = formData.get(kind);
              if (file instanceof File && file.size > 0) {
                const validationError = validateEventMaterial(file, kind);
                if (validationError) {
                  setError(validationError);
                  return;
                }
              }
            }
            startTransition(async () => {
              try {
                const result = await createEventAction(undefined, formData);
                if (result?.error) {
                  setError(result.error);
                } else {
                  setOpen(false);
                  resetForm();
                }
              } catch {
                setError("Couldn't finish publishing. Please check Events before trying again.");
              }
            });
          }}
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <fieldset className="space-y-4"><legend className="font-heading mb-3 text-xl font-semibold">Event details</legend>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" placeholder="Weekly Club Meeting" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-date">Date</Label>
              <Input id="event-date" name="date" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-time">Time (BVI)</Label>
              <Input id="event-time" name="time" type="time" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-location">Location or link</Label>
            <Input id="event-location" name="location" placeholder="Peebles Hospitality Centre" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" name="description" rows={3} />
          </div>

          </fieldset>
          <fieldset className="space-y-4 border-t border-border pt-4"><legend className="font-heading pr-3 text-xl font-semibold">Attendance</legend>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-capacity">Capacity</Label>
            <Input id="event-capacity" name="capacity" type="number" min="1" placeholder="Leave blank for unlimited" />
          </div>

          <div className="grid gap-2 rounded-lg border border-border p-3 text-sm">
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="allowGuests" className="size-4 accent-primary" />Allow guests</label>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="waitlistEnabled" className="size-4 accent-primary" />Enable waitlist when capacity is reached</label>
            <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="dietaryNotesEnabled" className="size-4 accent-primary" />Collect dietary requirements</label>
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              name="countsTowardAttendance"
              defaultChecked
              className="size-4 rounded border-border accent-primary"
            />
            Counts toward the 50% attendance requirement
          </label>

          </fieldset>
          <fieldset className="space-y-4 border-t border-border pt-4"><legend className="font-heading pr-3 text-xl font-semibold">Attachments <span className="font-sans text-sm font-normal text-muted-foreground">Optional</span></legend>
          <div className="flex flex-col gap-1.5">
            <Label>Flyer</Label>
            <input
              ref={flyerRef}
              type="file"
              name="flyer"
              accept="image/*"
              className="hidden"
              onChange={handleFlyer}
            />
            {flyerPreview ? (
              // Show the poster, not its filename — "IMG_4823.jpg" tells you
              // nothing about whether you picked the right one.
              <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flyerPreview}
                  alt=""
                  aria-hidden="true"
                  className="aspect-[3/4] w-16 shrink-0 rounded-md border border-border object-cover"
                />
                <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {flyerName}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Change flyer"
                  onClick={() => flyerRef.current?.click()}
                >
                  <Upload />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove flyer"
                  className="text-muted-foreground"
                  onClick={() => {
                    setFlyerName(null);
                    setFlyerPreview(null);
                    if (flyerRef.current) flyerRef.current.value = "";
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => flyerRef.current?.click()}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:bg-muted"
              >
                <ImageIcon className="size-5 text-muted-foreground" />
                <span className="font-heading text-sm font-medium text-foreground">
                  Add flyer
                </span>
                <span className="text-xs text-muted-foreground">
                  The poster members will see and share
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Agenda</Label>
            <input
              ref={agendaRef}
              type="file"
              name="agenda"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={(e) => setAgendaName(e.target.files?.[0]?.name ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              className="font-heading justify-start"
              onClick={() => agendaRef.current?.click()}
            >
              <FileText />
              <span className="truncate">{agendaName ?? "Add agenda"}</span>
            </Button>
          </div>
          </fieldset>
          </div>
          <DialogFooter className="m-0 shrink-0 flex-row items-center justify-between rounded-none bg-popover px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="button" variant="outline" disabled={pending} onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" disabled={pending} className="font-heading">
              {pending ? "Publishing…" : "Publish event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
