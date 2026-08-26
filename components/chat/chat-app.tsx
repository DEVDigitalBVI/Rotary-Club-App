"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, CalendarDays, ChevronDown, Hash, HeartHandshake, Loader2, MessageCirclePlus, MoreHorizontal, Reply, Search, Send, ShieldCheck, SmilePlus, Trash2, Users, X } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchField } from "@/components/ui/search-field";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { ChatChannel, ChatMessage, ChatReaction } from "@/lib/data/chat";
import type { Member } from "@/lib/mock-data";
import { deleteChatMessageAction, loadEarlierChatMessagesAction, markChatReadAction, sendChatMessageAction, startDirectChatAction, toggleChatReactionAction } from "@/app/(app)/chat/actions";

const REACTIONS = ["👍", "❤️", "👏", "🎉", "🙏"];

export function ChatApp({ channels, members, currentMemberId, canModerate, initialChannelId }: { channels: ChatChannel[]; members: Member[]; currentMemberId: string; canModerate: boolean; initialChannelId?: string }) {
  const [data, setData] = useState(channels);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(channels.some((item) => item.id === initialChannelId) ? initialChannelId! : channels[0]?.id ?? "");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [replyToId, setReplyToId] = useState<string>();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const threadEndRef = useRef<HTMLDivElement>(null);
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const selected = data.find((channel) => channel.id === selectedId) ?? data[0];
  const replyTo = selected?.messages.find((message) => message.id === replyToId);
  const lastMessageId = selected?.messages.at(-1)?.id;

  function displayName(channel: ChatChannel) {
    if (channel.kind !== "dm") return channel.kind === "committee" && channel.rotaryYear ? `${channel.name} · ${channel.rotaryYear}` : channel.name;
    const other = channel.memberIds.find((id) => id !== currentMemberId);
    return memberById.get(other ?? "")?.name ?? "Direct message";
  }

  useEffect(() => {
    if (!selectedId) return;
    const supabase = createClient();
    const subscription = supabase.channel(`chat:${selectedId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages", filter: `channel_id=eq.${selectedId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new;
          const message: ChatMessage = { id: row.id as string, channelId: row.channel_id as string, senderId: row.sender_id as string, body: row.body as string, replyToId: (row.reply_to_id as string | null) ?? undefined, editedAt: (row.edited_at as string | null) ?? undefined, deletedAt: (row.deleted_at as string | null) ?? undefined, createdAt: row.created_at as string, reactions: [] };
          setData((previous) => previous.map((channel) => channel.id !== selectedId || channel.messages.some((item) => item.id === message.id) ? channel : { ...channel, messages: [...channel.messages, message] }));
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new;
          setData((previous) => previous.map((channel) => channel.id === selectedId ? { ...channel, messages: channel.messages.map((message) => message.id === row.id ? { ...message, body: row.body as string, editedAt: (row.edited_at as string | null) ?? undefined, deletedAt: (row.deleted_at as string | null) ?? undefined } : message) } : channel));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Record<string, unknown>;
        const reaction: ChatReaction = { messageId: row.message_id as string, memberId: row.member_id as string, emoji: row.emoji as string };
        setData((previous) => previous.map((channel) => channel.id === selectedId ? { ...channel, messages: channel.messages.map((message) => {
          if (message.id !== reaction.messageId) return message;
          const without = message.reactions.filter((item) => !(item.memberId === reaction.memberId && item.emoji === reaction.emoji));
          return { ...message, reactions: payload.eventType === "DELETE" ? without : [...without, reaction] };
        }) } : channel));
      }).subscribe();
    return () => { void supabase.removeChannel(subscription); };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await markChatReadAction(selectedId);
        const now = new Date().toISOString();
        setData((previous) => previous.map((channel) => channel.id === selectedId ? { ...channel, lastReadAt: now } : channel));
      } catch { /* A badge update should never block reading chat. */ }
    });
  }, [selectedId]);
  // A newly received message should stay visible. Prepending an older page must
  // not throw the reader back to the bottom of the conversation.
  useEffect(() => { threadEndRef.current?.scrollIntoView({ block: "end" }); }, [selectedId, lastMessageId]);

  function sendMessage() {
    if (!draft.trim() || !selected || pending) return;
    const body = draft.trim();
    setDraft(""); setError("");
    startTransition(async () => {
      try {
        const row = await sendChatMessageAction(selected.id, body, replyToId);
        const message: ChatMessage = { id: row.id, channelId: row.channel_id, senderId: row.sender_id, body: row.body, replyToId: row.reply_to_id ?? undefined, editedAt: row.edited_at ?? undefined, deletedAt: row.deleted_at ?? undefined, createdAt: row.created_at, reactions: [] };
        setData((previous) => previous.map((channel) => channel.id === selected.id && !channel.messages.some((item) => item.id === message.id) ? { ...channel, messages: [...channel.messages, message] } : channel));
        setReplyToId(undefined);
      } catch (cause) { setDraft(body); setError(cause instanceof Error ? cause.message : "Unable to send that message."); }
    });
  }

  const visibleMessages = selected?.messages.filter((message) => {
    if (!query.trim()) return true;
    const needle = query.toLocaleLowerCase();
    return message.body.toLocaleLowerCase().includes(needle) || memberById.get(message.senderId)?.name.toLocaleLowerCase().includes(needle);
  }) ?? [];

  function selectChannel(id: string) { setSelectedId(id); setMobileShowThread(true); setQuery(""); setError(""); setReplyToId(undefined); }

  return <div className="grid h-[calc(100dvh-10.5rem)] min-h-[540px] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-card)] md:grid-cols-[19rem_minmax(0,1fr)]">
    <aside className={cn("min-w-0 flex-col border-r border-border bg-muted/25", mobileShowThread ? "hidden md:flex" : "flex")}>
      <div className="border-b border-border px-4 py-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Club chat</p><h2 className="mt-0.5 text-lg font-semibold text-foreground">Conversations</h2></div><NewDirectMessage members={members} currentMemberId={currentMemberId} onCreated={(id) => { router.push(`/chat?channel=${id}`); router.refresh(); }} /></div></div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ChannelSection label="Club" channels={data.filter((channel) => channel.kind === "club")} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        <ChannelSection label="My groups" channels={data.filter((channel) => !channel.archivedAt && ["committee", "project"].includes(channel.kind))} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        <ChannelSection label="Direct messages" channels={data.filter((channel) => !channel.archivedAt && channel.kind === "dm")} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        <ChannelSection label="Read-only archive" channels={data.filter((channel) => Boolean(channel.archivedAt))} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
      </div>
    </aside>
    <section className={cn("min-w-0 flex-col", mobileShowThread ? "flex" : "hidden md:flex")}>
      {selected ? <>
        <header className="flex min-h-16 items-center gap-3 border-b border-border px-3 sm:px-5"><Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMobileShowThread(false)} aria-label="Back to conversations"><ArrowLeft /></Button><ChannelIcon kind={selected.kind} /><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-foreground">{displayName(selected)}</h2><p className="truncate text-xs text-muted-foreground">{channelDescription(selected)}</p></div><SearchField value={query} onValueChange={setQuery} aria-label="Search this conversation" placeholder="Search conversation" className="hidden w-64 sm:block" inputClassName="h-9 text-sm" /></header>
        <div className="border-b border-border p-3 sm:hidden"><SearchField value={query} onValueChange={setQuery} aria-label="Search this conversation" placeholder="Search this conversation" /></div>
        <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6">{selected.hasEarlierMessages && !query && <div className="mb-4 text-center"><Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => { const first = selected.messages[0]; if (!first) return; try { const earlier = await loadEarlierChatMessagesAction(selected.id, first.createdAt); setData((previous) => previous.map((channel) => channel.id === selected.id ? { ...channel, messages: [...earlier, ...channel.messages], hasEarlierMessages: earlier.length === 50 } : channel)); } catch { setError("Unable to load earlier messages."); } })}>{pending ? <Loader2 className="animate-spin" /> : <ChevronDown className="rotate-180" />}Load earlier messages</Button></div>}{visibleMessages.map((message, index) => <MessageRow key={message.id} message={message} previous={visibleMessages[index - 1]} messages={selected.messages} memberById={memberById} currentMemberId={currentMemberId} canModerate={canModerate && !selected.archivedAt} onReply={setReplyToId} onError={setError} readOnly={Boolean(selected.archivedAt)} />)}{visibleMessages.length === 0 && <EmptyConversation searching={Boolean(query)} name={displayName(selected)} />}<div ref={threadEndRef} /></div>
        {selected.archivedAt ? <footer className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground"><Archive className="size-4" />This Rotary-year archive is read-only.</footer> : <footer className="border-t border-border bg-card p-3 sm:p-4">{replyTo && <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-muted/60 px-3 py-2 text-xs"><Reply className="size-3.5 text-primary" /><span className="min-w-0 flex-1 truncate">Replying to {memberById.get(replyTo.senderId)?.name}: {replyTo.body}</span><Button variant="ghost" size="icon-xs" onClick={() => setReplyToId(undefined)}><X /></Button></div>}<div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder={`Message ${displayName(selected)}`} rows={1} className="max-h-32 min-h-9 resize-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0" /><Button size="icon" onClick={sendMessage} disabled={!draft.trim() || pending} aria-label="Send message">{pending ? <Loader2 className="animate-spin" /> : <Send />}</Button></div><div className="mt-1.5 flex justify-between px-1 text-[11px] text-muted-foreground"><span>{error || "Enter to send · Shift + Enter for a new line"}</span><span>{draft.length}/4000</span></div></footer>}
      </> : <EmptyConversation name="chat" searching={false} />}
    </section>
  </div>;
}

function ChannelSection({ label, channels, selectedId, currentMemberId, memberById, displayName, onSelect }: { label: string; channels: ChatChannel[]; selectedId: string; currentMemberId: string; memberById: Map<string, Member>; displayName: (channel: ChatChannel) => string; onSelect: (id: string) => void }) {
  if (!channels.length) return null;
  return <div className="mb-5"><p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{label}</p>{channels.map((channel) => {
    const last = channel.messages.at(-1); const unread = channel.messages.filter((message) => message.senderId !== currentMemberId && (!channel.lastReadAt || message.createdAt > channel.lastReadAt)).length; const otherId = channel.memberIds.find((id) => id !== currentMemberId);
    return <button key={channel.id} onClick={() => onSelect(channel.id)} className={cn("group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted", channel.id === selectedId && "bg-primary/10 text-primary hover:bg-primary/10")}>{channel.kind === "dm" ? <MemberAvatar member={memberById.get(otherId ?? "")} className="size-9 shrink-0" fallbackClassName="text-xs" /> : <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm", channel.id === selectedId && "bg-primary text-primary-foreground")}><ChannelIcon kind={channel.kind} /></div>}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className={cn("truncate text-sm", unread ? "font-semibold text-foreground" : "font-medium")}>{displayName(channel)}</p>{unread > 0 && <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{Math.min(unread, 99)}</span>}</div><p className={cn("mt-0.5 truncate text-xs text-muted-foreground", unread && "text-foreground/70")}>{last ? `${memberById.get(last.senderId)?.name.split(" ")[0] ?? "Member"}: ${last.body}` : channel.kind === "dm" ? "Start a conversation" : channelDescription(channel)}</p></div></button>;
  })}</div>;
}

function MessageRow({ message, previous, messages, memberById, currentMemberId, canModerate, onReply, onError, readOnly }: { message: ChatMessage; previous?: ChatMessage; messages: ChatMessage[]; memberById: Map<string, Member>; currentMemberId: string; canModerate: boolean; onReply: (id: string) => void; onError: (error: string) => void; readOnly: boolean }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, startRemoving] = useTransition();
  const sender = memberById.get(message.senderId); const parent = messages.find((item) => item.id === message.replyToId); const compact = previous?.senderId === message.senderId && new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60_000; const groupedReactions = REACTIONS.map((emoji) => ({ emoji, members: message.reactions.filter((item) => item.emoji === emoji).map((item) => item.memberId) })).filter((item) => item.members.length);
  return <><div className={cn("group relative flex gap-3 rounded-xl px-2 py-1.5 hover:bg-muted/45", !compact && "mt-3 pt-3")}>{compact ? <div className="w-9 shrink-0 pt-1 text-center text-[10px] text-transparent group-hover:text-muted-foreground">{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div> : <MemberAvatar member={sender} className="size-9 shrink-0" fallbackClassName="text-xs" />}<div className="min-w-0 flex-1">{!compact && <div className="flex items-baseline gap-2"><p className="text-sm font-semibold text-foreground">{sender?.name ?? "Former member"}</p><time className="text-[11px] text-muted-foreground">{formatDateTime(message.createdAt)}</time></div>}{parent && <button onClick={() => document.getElementById(`message-${parent.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-1 block max-w-full truncate border-l-2 border-primary/50 pl-2 text-xs text-muted-foreground hover:text-foreground">{memberById.get(parent.senderId)?.name}: {parent.body}</button>}<p id={`message-${message.id}`} className={cn("whitespace-pre-wrap break-words text-sm leading-6 text-foreground", message.deletedAt && "italic text-muted-foreground")}>{message.body}{message.editedAt && !message.deletedAt && <span className="ml-1 text-[10px] text-muted-foreground">(edited)</span>}</p>{groupedReactions.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{groupedReactions.map(({ emoji, members }) => <button key={emoji} disabled={readOnly} onClick={() => void toggleChatReactionAction(message.id, emoji)} className={cn("rounded-full border bg-background px-2 py-0.5 text-xs hover:border-primary disabled:cursor-default", members.includes(currentMemberId) && "border-primary bg-primary/10")} title={members.map((id) => memberById.get(id)?.name).join(", ")}>{emoji} {members.length}</button>)}</div>}</div>{!readOnly && !message.deletedAt && <div className="absolute -top-3 right-2 flex items-center rounded-lg border bg-card p-0.5 shadow-sm sm:hidden sm:group-hover:flex sm:group-focus-within:flex"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Add reaction" />}><SmilePlus /></DropdownMenuTrigger><DropdownMenuContent align="end" className="flex min-w-0 gap-0.5 p-1">{REACTIONS.map((emoji) => <button key={emoji} className="rounded-md p-1.5 text-base hover:bg-muted" onClick={() => { onError(""); void toggleChatReactionAction(message.id, emoji).catch(() => onError("Unable to update that reaction.")); }}>{emoji}</button>)}</DropdownMenuContent></DropdownMenu><Button variant="ghost" size="icon-xs" onClick={() => onReply(message.id)} aria-label="Reply"><Reply /></Button>{(message.senderId === currentMemberId || canModerate) && <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label="Message options" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onClick={() => setRemoveOpen(true)}><Trash2 />Remove message</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div>}</div><Dialog open={removeOpen} onOpenChange={setRemoveOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Remove this message?</DialogTitle></DialogHeader><p className="text-sm leading-6 text-muted-foreground">The message from {sender?.name ?? "this member"} will be replaced with “Message removed.” This cannot be undone.</p>{canModerate && message.senderId !== currentMemberId && <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300"><ShieldCheck className="mt-0.5 size-4 shrink-0" />You’re removing this message as a board moderator.</div>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removing}>Cancel</Button><Button variant="destructive" disabled={removing} onClick={() => startRemoving(async () => { onError(""); try { await deleteChatMessageAction(message.id); setRemoveOpen(false); } catch (cause) { onError(cause instanceof Error ? cause.message : "Unable to remove that message."); } })}>{removing ? <Loader2 className="animate-spin" /> : <Trash2 />}Remove message</Button></div></DialogContent></Dialog></>;
}

function NewDirectMessage({ members, currentMemberId, onCreated }: { members: Member[]; currentMemberId: string; onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(""); const [pending, startTransition] = useTransition(); const choices = members.filter((member) => member.id !== currentMemberId && member.status === "active" && member.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" size="icon-sm" aria-label="New direct message" />}><MessageCirclePlus /></DialogTrigger><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>New conversation</DialogTitle></DialogHeader><SearchField value={query} onValueChange={setQuery} aria-label="Search club members" placeholder="Search club members" autoFocus /><div className="max-h-80 overflow-y-auto">{choices.map((member) => <button key={member.id} disabled={pending} onClick={() => startTransition(async () => { const id = await startDirectChatAction(member.id); setOpen(false); onCreated(id); })} className="flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><MemberAvatar member={member} className="size-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.classification}</p></div>{pending ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />}</button>)}</div></DialogContent></Dialog>;
}

function ChannelIcon({ kind }: { kind: ChatChannel["kind"] }) { const className = "size-4"; if (kind === "committee") return <Users className={className} />; if (kind === "event") return <CalendarDays className={className} />; if (kind === "project") return <HeartHandshake className={className} />; if (kind === "club") return <ShieldCheck className={className} />; return <Hash className={className} />; }
function channelDescription(channel: ChatChannel) { if (channel.archivedAt) return "Read-only Rotary-year archive"; return { club: "Open to all active club members", committee: "Private committee room", event: "Event conversation", project: "For project volunteers", dm: "Private conversation" }[channel.kind]; }
function EmptyConversation({ searching, name }: { searching: boolean; name: string }) { return <div className="flex h-full min-h-56 flex-col items-center justify-center px-8 text-center"><div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">{searching ? <Search /> : <MessageCirclePlus />}</div><h3 className="text-base font-semibold">{searching ? "No matching messages" : `Start the conversation in ${name}`}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{searching ? "Try a different name or phrase." : "Share an update, ask a question, or coordinate the next step with your fellow members."}</p></div>; }
