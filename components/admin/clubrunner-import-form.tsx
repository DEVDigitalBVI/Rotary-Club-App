"use client";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importClubRunnerMembers, previewClubRunnerImport, type ClubRunnerImportState } from "@/app/(app)/admin/clubrunner/actions";
type Preview = Awaited<ReturnType<typeof previewClubRunnerImport>>;
export function ClubRunnerImportForm() {
  const [state, action, pending] = useActionState<ClubRunnerImportState, FormData>(importClubRunnerMembers, undefined);
  const [preview, setPreview] = useState<Preview>();
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const generation = useRef(0);
  return <form action={action} className="space-y-5"><label className="block text-sm font-semibold">ClubRunner roster export<Input className="mt-2" type="file" name="roster" accept=".csv,text/csv" required disabled={pending} onChange={async e => {
    const file = e.target.files?.[0]; const request = ++generation.current;
    setPreview(undefined); setReviewed(false);
    if (!file) { setLoading(false); return; }
    if (file.size > 1_000_000) { setLoading(false); setPreview({ error: "Choose a file smaller than 1 MB." }); return; }
    setLoading(true); const data = new FormData(); data.set("roster", file);
    try { const next = await previewClubRunnerImport(data); if (request === generation.current) setPreview(next); }
    catch { if (request === generation.current) setPreview({ error: "Couldn’t load the preview. Reconnect and choose the file again." }); }
    finally { if (request === generation.current) setLoading(false); }
  }} /></label><p className="text-sm text-muted-foreground">Up to 500 members and 1 MB. Missing optional values preserve the existing roster. Membership status is changed separately in the member profile.</p>
  {loading && <p role="status">Comparing with the current roster…</p>}
  {(preview?.error || state?.error) && <p role="alert" className="text-sm text-destructive">{preview?.error || state?.error}</p>}
  {preview?.plan && <><input type="hidden" name="fingerprint" value={preview.fingerprint}/><p className="text-sm font-semibold">{preview.plan.filter(row => row.kind === "added").length} additions · {preview.plan.filter(row => row.kind === "changed").length} changes · {preview.plan.filter(row => row.kind === "unchanged").length} unchanged</p><div className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-border p-4">{preview.plan.map(row => <article key={row.email}><h3 className="text-sm">{row.name} · {row.kind}</h3><p className="text-xs text-muted-foreground">{row.email}</p><ul className="mt-1 text-sm">{row.changes.map(change => <li key={change.field}>{change.field.replaceAll("_", " ")}: {change.before || "Empty"} → {change.after || "Empty"}</li>)}</ul></article>)}</div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)}/>I have reviewed these changes.</label></>}
  {state?.success && <p role="status" className="text-sm text-primary">{state.success}</p>}
  <Button disabled={pending || loading || !preview?.plan || !reviewed}>{pending ? "Updating roster…" : "Apply reviewed changes"}</Button></form>;
}
