"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { loadChatContextAction, searchChatMessagesAction } from "@/app/(app)/chat/actions";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { formatDateTime } from "@/lib/format";
import type { ChatMessage } from "@/lib/data/chat";
import type { Member } from "@/lib/club";

function Highlight({ body, query }: { body: string; query: string }) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return body;
  const parts = []; let start = 0; let index = body.toLocaleLowerCase().indexOf(needle);
  while (index !== -1) {
    parts.push(body.slice(start, index), <mark key={index} className="rounded bg-amber-200 text-slate-900">{body.slice(index, index + needle.length)}</mark>);
    start = index + needle.length; index = body.toLocaleLowerCase().indexOf(needle, start);
  }
  parts.push(body.slice(start)); return <>{parts}</>;
}

export function ChatSearch({ channelId, query, onQuery, memberById }: { channelId: string; query: string; onQuery: (value: string) => void; memberById: Map<string, Member> }) {
  const [result, setResult] = useState<{ query: string; messages: ChatMessage[]; more: boolean }>({ query: "", messages: [], more: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [context, setContext] = useState<{ target: string; messages: ChatMessage[] }>();
  const generation = useRef(0);
  useEffect(() => {
    const request = ++generation.current;
    const timer = setTimeout(() => {
      setContext(undefined); setError("");
      if (!query.trim()) { setResult({ query, messages: [], more: false }); setBusy(false); return; }
      setBusy(true);
      void searchChatMessagesAction(channelId, query).then((messages) => {
        if (request === generation.current) setResult({ query, messages, more: messages.length === 50 });
      }).catch(() => { if (request === generation.current) setError("Search is unavailable. Try again."); })
        .finally(() => { if (request === generation.current) setBusy(false); });
    }, 300);
    return () => { clearTimeout(timer); generation.current = request + 1; };
  }, [channelId, query]);
  useEffect(() => {
    if (context) document.getElementById(`search-message-${context.target}`)?.scrollIntoView({ block: "center" });
  }, [context]);
  const current = result.query === query;
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="shrink-0 border-b border-border p-3"><SearchField value={query} onValueChange={onQuery} maxLength={200} autoFocus aria-label="Search all messages in this conversation" placeholder="Search all messages…" /><p className="mt-2 text-xs text-muted-foreground">{context ? "Surrounding messages · up to 20 on each side" : "Search the full conversation history"}</p></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      {context && <Button variant="ghost" size="sm" className="mb-3" onClick={() => setContext(undefined)}><ArrowLeft />Back to results</Button>}
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
      {(busy || !current) && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Searching…</p>}
      {current && !context && !result.messages.length && !busy && <p className="py-8 text-center text-sm text-muted-foreground">{query.trim() ? "No matching messages. Try another phrase." : "Find a message, decision, or update."}</p>}
      {current && (context?.messages ?? result.messages).map((message) => <article id={`search-message-${message.id}`} key={message.id} className={`mb-3 rounded-xl border p-3 ${context?.target === message.id ? "border-primary bg-primary/5" : "border-border"}`}>
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2"><span className="text-sm font-semibold">{memberById.get(message.senderId)?.name ?? "Former member"}</span><time className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</time></div>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6"><Highlight body={message.body} query={query} /></p>
        {!context && <Button variant="ghost" size="sm" disabled={busy} className="mt-2 text-primary" onClick={async () => { const request = generation.current; setBusy(true); setError(""); try { const messages = await loadChatContextAction(channelId, message.id); if (request === generation.current) setContext({ target: message.id, messages }); } catch { if (request === generation.current) setError("Unable to open that message."); } finally { if (request === generation.current) setBusy(false); } }}>View in conversation</Button>}
      </article>)}
      {current && !context && result.more && <Button variant="outline" disabled={busy} onClick={async () => { const request = generation.current; setBusy(true); try { const messages = await searchChatMessagesAction(channelId, query, result.messages.length); if (request === generation.current) setResult((previous) => ({ query, messages: [...previous.messages, ...messages], more: messages.length === 50 })); } catch { if (request === generation.current) setError("Unable to load more results."); } finally { if (request === generation.current) setBusy(false); } }}>More results</Button>}
    </div>
  </div>;
}
