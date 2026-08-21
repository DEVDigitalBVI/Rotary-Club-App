"use client";

import { useState } from "react";
import { Award, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EditRecognitionDialog } from "@/components/directory/edit-recognition-dialog";
import { paulHarrisLabel, type FoundationRecognition, type Member } from "@/lib/mock-data";

export function RecognitionCard({
  member,
  recognition,
  canEdit,
}: {
  member: Member;
  recognition: FoundationRecognition;
  canEdit: boolean;
}) {
  // Local state so an edit shows up immediately in the preview; a real build
  // would refetch the member instead.
  const [current, setCurrent] = useState(recognition);
  const [open, setOpen] = useState(false);

  const paulHarris = paulHarrisLabel(current.paulHarrisCount);
  const hasAny =
    current.paulHarrisCount > 0 ||
    current.polioPlusSociety ||
    current.actionGroups.length > 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading flex items-center gap-2 text-sm font-semibold text-foreground">
            <Award className="size-4 text-muted-foreground" />
            Rotary Foundation
          </h2>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="font-heading -mt-1 shrink-0"
              onClick={() => setOpen(true)}
            >
              <Pencil />
              Edit
            </Button>
          )}
        </div>

        {hasAny ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {paulHarris && <StatusBadge tone="gold">{paulHarris}</StatusBadge>}
              {current.polioPlusSociety && (
                <StatusBadge tone="cardinal">PolioPlus Society</StatusBadge>
              )}
            </div>

            {current.actionGroups.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Action groups</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {current.actionGroups.map((group) => (
                    <StatusBadge key={group} tone="violet">
                      {group}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No Foundation recognition recorded yet.
          </p>
        )}
      </CardContent>

      {canEdit && (
        <EditRecognitionDialog
          member={member}
          recognition={current}
          open={open}
          onOpenChange={setOpen}
          onSave={setCurrent}
        />
      )}
    </Card>
  );
}
