"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { NotificationPreferences } from "@/lib/notifications";
import { updateNotificationPreferencesAction } from "@/app/(app)/notifications/actions";

const options: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "announcements", label: "Club announcements", description: "Notices published to you by club leaders." },
  { key: "events", label: "Events", description: "New events and waitlist updates." },
  { key: "service", label: "Service projects", description: "New opportunities and volunteer activity." },
  { key: "chat", label: "Chat", description: "Replies and messages that mention you." },
  { key: "administration", label: "Club administration", description: "Attendance, makeups, and account-related tasks." },
];

export function NotificationPreferencesForm({ initial }: { initial: NotificationPreferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <Card>
      <CardContent>
        <div><h2 className="font-heading text-xl font-semibold">What you’re notified about</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">These settings affect new in-app notifications. Important information remains available on its original page.</p></div>
        <div className="mt-5 divide-y divide-border">
          {options.map((option) => (
            <label key={option.key} className="flex min-h-16 cursor-pointer items-center gap-4 py-3">
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{option.label}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{option.description}</span></span>
              <input type="checkbox" className="peer sr-only" checked={preferences[option.key]} onChange={(event) => { setMessage(""); setPreferences((current) => ({ ...current, [option.key]: event.target.checked })); }} />
              <span aria-hidden="true" className="flex h-8 w-12 shrink-0 items-center rounded-full bg-muted p-1 transition-colors peer-checked:bg-primary peer-checked:[&>span]:translate-x-4 peer-checked:[&_svg]:opacity-100 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40"><span className="flex size-6 translate-x-0 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-transform"><Check className="size-3.5 opacity-0" /></span></span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5">
          <p role="status" className="text-sm text-muted-foreground">{message}</p>
          <Button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await updateNotificationPreferencesAction(preferences); setMessage(result?.error ?? "Preferences saved."); })}>{pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}{pending ? "Saving…" : "Save preferences"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
