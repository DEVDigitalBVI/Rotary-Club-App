"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
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
import type { FeeSettings } from "@/lib/mock-data";

export function FeeSettingsDialog({ settings }: { settings: FeeSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="font-heading" onClick={() => setOpen(true)}>
        <Settings2 />
        Fee settings
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Meeting fee settings</DialogTitle>
          <DialogDescription>
            Changes apply to charges created after you save — past charges
            aren&apos;t affected.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fee-in-person">In-person meeting fee</Label>
            <Input
              id="fee-in-person"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.inPersonFee}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fee-online">Online meeting fee</Label>
            <Input
              id="fee-online"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.onlineFee}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fee-annual">Annual membership dues</Label>
            <Input
              id="fee-annual"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.annualDues}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="submit" className="font-heading">
              Save settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
