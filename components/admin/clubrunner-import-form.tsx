"use client";

import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseClubRunnerCsv, type ClubRunnerCsvResult } from "@/lib/clubrunner-csv";
import { importClubRunnerMembers, type ClubRunnerImportState } from "@/app/(app)/admin/clubrunner/actions";

export function ClubRunnerImportForm() {
  const [state, action, pending] = useActionState<ClubRunnerImportState, FormData>(importClubRunnerMembers, undefined);
  const [preview, setPreview] = useState<ClubRunnerCsvResult | null>(null);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="clubrunner-roster">ClubRunner roster export</Label>
        <Input
          id="clubrunner-roster"
          name="roster"
          type="file"
          accept=".csv,text/csv"
          required
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            setPreview(file ? parseClubRunnerCsv(await file.text()) : null);
          }}
          className="h-auto py-3 file:mr-3"
        />
        <p className="text-sm leading-6 text-muted-foreground">Up to 500 members and 1 MB. Required columns: name and email. First/last name columns are also accepted.</p>
      </div>

      {preview && preview.errors.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div><strong className="block">Fix the CSV before importing</strong><ul className="mt-1 list-disc space-y-1 pl-4">{preview.errors.slice(0, 5).map((error) => <li key={error}>{error}</li>)}</ul></div>
        </div>
      )}

      {preview && preview.errors.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/35 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><FileSpreadsheet className="size-4 text-primary" />{preview.rows.length} members ready</div>
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
            {preview.rows.slice(0, 3).map((row) => <div key={row.email} className="flex items-center justify-between gap-4 border-b border-border px-3 py-2 text-sm last:border-0"><span className="font-medium">{row.name}</span><span className="truncate text-muted-foreground">{row.email}</span></div>)}
          </div>
          {preview.rows.length > 3 && <p className="mt-2 text-xs text-muted-foreground">And {preview.rows.length - 3} more.</p>}
        </div>
      )}

      {state?.error && <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="flex items-start gap-2 rounded-xl border border-emerald-600/20 bg-emerald-600/10 p-4 text-sm text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{state.success}</p>}

      <Button type="submit" disabled={pending || !preview || preview.errors.length > 0 || preview.rows.length === 0}>
        <Upload />{pending ? "Updating roster…" : "Apply roster update"}
      </Button>
    </form>
  );
}
