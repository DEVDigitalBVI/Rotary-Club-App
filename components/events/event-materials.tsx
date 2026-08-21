"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Flyer and agenda for one event. Uploads here are previews: the file is held
 * as an object URL for the session, exactly as the profile-photo picker does,
 * so the flow can be walked through without a storage backend. A real build
 * swaps the object URL for an uploaded file's address and nothing else here
 * has to change.
 */
export function EventMaterials({
  flyer,
  agenda,
  canManage,
  showAgenda,
}: {
  flyer?: EventFlyer;
  agenda?: EventAgenda;
  canManage: boolean;
  /** Agendas belong to meetings still to come; past ones only keep a record. */
  showAgenda: boolean;
}) {
  const [currentFlyer, setCurrentFlyer] = useState(flyer);
  const [currentAgenda, setCurrentAgenda] = useState(agenda);
  const flyerInputRef = useRef<HTMLInputElement>(null);
  const agendaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = currentFlyer?.url;
    if (!url?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(url);
  }, [currentFlyer]);

  useEffect(() => {
    const url = currentAgenda?.url;
    if (!url?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(url);
  }, [currentAgenda]);

  function handleFlyer(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentFlyer({ url: URL.createObjectURL(file), alt: file.name });
    // Clear the input so re-picking the same file still fires a change event.
    e.target.value = "";
  }

  function handleAgenda(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentAgenda({
      fileName: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    });
    e.target.value = "";
  }

  // Members with nothing to see and no ability to add shouldn't get an
  // empty card telling them so.
  if (!canManage && !currentFlyer && !currentAgenda) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Materials
        </h2>

        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Flyer</p>
          {currentFlyer ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentFlyer.url}
                alt={currentFlyer.alt}
                className="w-full rounded-lg border border-border"
              />
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-heading"
                    onClick={() => flyerInputRef.current?.click()}
                  >
                    <Upload />
                    Replace
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-heading text-muted-foreground"
                    onClick={() => setCurrentFlyer(undefined)}
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

        {(showAgenda || currentAgenda) && (
          <section className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Agenda</p>
            {currentAgenda ? (
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {currentAgenda.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Posted {formatDate(currentAgenda.uploadedAt)}
                    {currentAgenda.sizeLabel && ` · ${currentAgenda.sizeLabel}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Download agenda"
                  nativeButton={false}
                  render={
                    <a
                      href={currentAgenda.url}
                      download={currentAgenda.fileName}
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
                    onClick={() => setCurrentAgenda(undefined)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            ) : canManage ? (
              <button
                type="button"
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
