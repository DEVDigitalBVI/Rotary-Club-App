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
  const [open, setOpen] = useState(false);

  const paulHarris = paulHarrisLabel(recognition.paulHarrisCount);
  const hasAny =
    recognition.paulHarrisCount > 0 ||
    recognition.polioPlusSociety ||
    recognition.actionGroups.length > 0;

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
              {recognition.polioPlusSociety && (
                <StatusBadge tone="cardinal">PolioPlus Society</StatusBadge>
              )}
            </div>

            {recognition.actionGroups.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Action groups</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {recognition.actionGroups.map((group) => (
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
          recognition={recognition}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </Card>
  );
}
