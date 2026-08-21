"use client";

import { useEffect, useRef, useState } from "react";
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

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    e.target.value = "";
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSubmitted(false);
          setFlyerName(null);
          setFlyerPreview(null);
          setAgendaName(null);
        }
      }}
    >
      <Button className="font-heading" onClick={() => setOpen(true)}>
        <Plus />
        Create event
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Members will see this on their Events tab right away.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-foreground">
            This is a design preview — events aren&apos;t saved yet.
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" placeholder="Weekly Club Meeting" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">Date</Label>
                <Input id="event-date" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-time">Time</Label>
                <Input id="event-time" type="time" required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-location">Location or link</Label>
              <Input id="event-location" placeholder="Peebles Hospitality Centre" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-description">Description</Label>
              <Textarea id="event-description" rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Flyer</Label>
              <input
                ref={flyerRef}
                type="file"
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
                  accept=".pdf,.doc,.docx,application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    setAgendaName(e.target.files?.[0]?.name ?? null)
                  }
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
            <DialogFooter className="mt-2">
              <Button type="submit" className="font-heading">
                Publish event
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
