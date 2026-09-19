"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { toMessage, type MessageRow } from "@/lib/chat-message";
import { chatDayLabel, chatTime, isUnread, sortConversations } from "@/lib/chat-display";
import { ChatSearch } from "@/components/chat/chat-search";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, CalendarDays, ChevronDown, Hash, HeartHandshake, Loader2, MessageCirclePlus, MoreHorizontal, Reply, Search, Send, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchField } from "@/components/ui/search-field";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDateTime, toClubDateString } from "@/lib/format";
import type { ChatChannel, ChatMessage, ChatReaction } from "@/lib/data/chat";
import type { Member } from "@/lib/club";
import { loadChatThreadAction, deleteChatMessageAction, deleteDirectChatAction, loadEarlierChatMessagesAction, refreshChatChannelsAction, markChatReadAction, sendChatMessageAction, startDirectChatAction, toggleChatReactionAction } from "@/app/(app)/chat/actions";

const REACTIONS = [
  "👍", "❤️", "👏", "🎉", "🙏",
  "😊", "😂", "🙌", "🔥", "💯",
  "✅", "👀", "🤝", "💡", "📌",
];

export function ChatApp({ channels, members, currentMemberId, canModerate, initialChannelId }: { channels: ChatChannel[]; members: Member[]; currentMemberId: string; canModerate: boolean; initialChannelId?: string }) {
  const [data, setData] = useState(channels);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(channels.some((item) => item.id === initialChannelId) ? initialChannelId! : channels[0]?.id ?? "");
  const selectedRef = useRef(selectedId);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  const [mobileShowThread, setMobileShowThread] = useState(Boolean(initialChannelId));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftsReady, setDraftsReady] = useState(false);
  useEffect(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(`rotary-draft:${currentMemberId}:chat`) ?? "{}"); if (saved && typeof saved === "object") setDrafts(Object.fromEntries(Object.entries(saved).filter((entry): entry is [string, string] => typeof entry[1] === "string"))); } catch {}
    setDraftsReady(true);
  }, [currentMemberId]);
  useEffect(() => { if (draftsReady) { try { sessionStorage.setItem(`rotary-draft:${currentMemberId}:chat`, JSON.stringify(drafts)); } catch {} } }, [drafts, draftsReady, currentMemberId]);
  const [replies, setReplies] = useState<Record<string, string | undefined>>({});
  const [failures, setFailures] = useState<Record<string, { id: string; body: string; replyToId?: string; error: string }>>({});
  const [sending, setSending] = useState<string>();
  const sendingRef = useRef(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [conversationQuery, setConversationQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const [visible, setVisible] = useState(false);
  const [unreadBoundaries, setUnreadBoundaries] = useState(() => Object.fromEntries(channels.map((channel) => [channel.id, channel.lastReadAt])));
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const selected = data.find((channel) => channel.id === selectedId);
  const draft = drafts[selectedId] ?? "";
  const replyToId = replies[selectedId];
  const replyTo = selected?.messages.find((message) => message.id === replyToId);
  const lastMessage = selected?.messages.at(-1);
  const lastMessageId = lastMessage?.id;
  const lastMessageTime = lastMessage?.createdAt;
  const lastReadAt = selected?.lastReadAt;

  const threadLoaded = selected?.loaded;
  useEffect(() => {
    if (!selectedId || threadLoaded) return;
    let disposed = false;
    void loadChatThreadAction(selectedId).then(thread => {
      if (!disposed) setData(previous => previous.map(channel => {
        if (channel.id !== selectedId) return channel;
        const messages = new Map(thread.messages.map(message => [message.id, message]));
        channel.messages.forEach(message => { if (!messages.has(message.id)) messages.set(message.id, message); });
        return { ...channel, ...thread, messages: [...messages.values()].sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)), loaded: true };
      }));
    }).catch(() => { if (!disposed) setError("Unable to load this conversation. Select another conversation and try again."); });
    return () => { disposed = true; };
  }, [selectedId, threadLoaded]);

  function displayName(channel: ChatChannel) {
    if (channel.kind !== "dm") return channel.name;
    const other = channel.memberIds.find((id) => id !== currentMemberId);
    return memberById.get(other ?? "")?.name ?? "Direct message";
  }
  function scrollToLatest() {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
    atBottomRef.current = true;
    setAtBottom(true);
  }
  // Read state follows the visible thread, including tab visibility and mobile navigation.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setVisible(document.visibilityState === "visible" && (media.matches || mobileShowThread));
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => { media.removeEventListener("change", update); document.removeEventListener("visibilitychange", update); };
  }, [mobileShowThread]);

  useEffect(() => {
    const supabase = createClient();
    const knownChannels = new Set(channels.map((channel) => channel.id));
    let disposed = false;
    let refreshing = false;
    let subscribed = false;
    const refresh = async (includeThread = false) => {
      if (refreshing || disposed) return;
      refreshing = true;
      try {
        const fresh = await refreshChatChannelsAction(includeThread ? selectedRef.current : undefined);
        fresh.forEach((channel) => knownChannels.add(channel.id));
        if (!disposed) setData((previous) => fresh.map((channel) => {
          const cached = previous.find((item) => item.id === channel.id);
          if (!cached) return channel;
          if (channel.loaded && cached.messages.length && channel.messages[0]?.createdAt > cached.messages.at(-1)!.createdAt) return channel;
          const messages = new Map(cached.messages.map((message) => [message.id, message]));
          channel.messages.forEach((message) => messages.set(message.id, message));
          return { ...channel, loaded: channel.loaded || cached.loaded, messages: [...messages.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), hasEarlierMessages: cached.hasEarlierMessages, lastReadAt: (cached.lastReadAt ?? "") > (channel.lastReadAt ?? "") ? cached.lastReadAt : channel.lastReadAt };
        }));
      } catch { /* Existing conversations remain usable during reconnects. */ }
      finally { refreshing = false; }
    };
    const subscription = supabase.channel("chat:conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const message = toMessage(payload.new as MessageRow, []);
          if (!knownChannels.has(message.channelId)) void refresh();
          setData((previous) => previous.map((channel) => channel.id !== message.channelId || channel.messages.some((item) => item.id === message.id) ? channel : { ...channel, messages: [...channel.messages, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }));
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new;
          setData((previous) => previous.map((channel) => channel.id === row.channel_id ? { ...channel, messages: channel.messages.map((message) => message.id === row.id ? { ...message, body: row.body as string, editedAt: (row.edited_at as string | null) ?? undefined, deletedAt: (row.deleted_at as string | null) ?? undefined } : message) } : channel));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_reactions" }, (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Record<string, unknown>;
        const reaction: ChatReaction = { messageId: row.message_id as string, memberId: row.member_id as string, emoji: row.emoji as string };
        setData((previous) => previous.map((channel) => ({ ...channel, messages: channel.messages.map((message) => {
          if (message.id !== reaction.messageId) return message;
          const without = message.reactions.filter((item) => !(item.memberId === reaction.memberId && item.emoji === reaction.emoji));
          return { ...message, reactions: payload.eventType === "DELETE" ? without : [...without, reaction] };
        }) })));
      })
      .subscribe((status) => { if (status === "SUBSCRIBED") { void refresh(subscribed); subscribed = true; } });
    const onFocus = () => { void refresh(true); };
    window.addEventListener("focus", onFocus);
    return () => { disposed = true; window.removeEventListener("focus", onFocus); void supabase.removeChannel(subscription); };
  }, [currentMemberId, channels]);

  useEffect(() => {
    if (!threadLoaded || !selectedId || !lastMessageTime || (lastReadAt && lastReadAt >= lastMessageTime) || !visible || !atBottom || searchOpen) return;
    const timer = setTimeout(() => {
      void markChatReadAction(selectedId, lastMessageTime).then(() => {
        setData((previous) => previous.map((channel) => channel.id === selectedId ? { ...channel, lastReadAt: channel.lastReadAt && channel.lastReadAt > lastMessageTime ? channel.lastReadAt : lastMessageTime } : channel));
      }).catch(() => { /* A read receipt should not block the conversation. */ });
    }, 500);
    return () => clearTimeout(timer);
  }, [threadLoaded, selectedId, lastMessageTime, lastReadAt, visible, atBottom, searchOpen]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread && atBottomRef.current) thread.scrollTop = thread.scrollHeight;
  }, [selectedId, lastMessageId, mobileShowThread, searchOpen]);
  useEffect(() => {
    const input = textareaRef.current;
    if (input) { input.style.height = "auto"; input.style.height = `${Math.min(input.scrollHeight, 144)}px`; }
  }, [draft, selectedId]);

  async function sendMessage(retry?: { id: string; body: string; replyToId?: string }) {
    if (!selected || sendingRef.current) return;
    const channelId = selected.id;
    const messageId = retry?.id ?? crypto.randomUUID();
    const body = retry?.body ?? draft.trim();
    const replyId = retry ? retry.replyToId : replyToId;
    if (!body || body.length > 4000) return;
    sendingRef.current = true;
    setSending(channelId);
    setError("");
    if (!retry) {
      setDrafts((previous) => ({ ...previous, [channelId]: "" }));
      setReplies((previous) => ({ ...previous, [channelId]: undefined }));
    }
    try {
      const row = await sendChatMessageAction(channelId, body, replyId, messageId);
      const message = toMessage(row, []);
      setData((previous) => previous.map((channel) => channel.id === channelId && !channel.messages.some((item) => item.id === message.id) ? { ...channel, messages: [...channel.messages, message] } : channel));
      setFailures((previous) => { const next = { ...previous }; delete next[channelId]; return next; });
    } catch (cause) {
      setDrafts(previous => ({ ...previous, [channelId]: previous[channelId] || body }));
      setFailures((previous) => ({ ...previous, [channelId]: { id: messageId, body, replyToId: replyId, error: cause instanceof Error ? cause.message : "Unable to send that message." } }));
    } finally { sendingRef.current = false; setSending(undefined); }
  }

  function selectChannel(id: string) {
    if (id !== selectedId) setUnreadBoundaries((previous) => ({ ...previous, [id]: data.find((channel) => channel.id === id)?.lastReadAt }));
    setSelectedId(id); setMobileShowThread(true); setQuery(""); setSearchOpen(false); setError(""); atBottomRef.current = true; setAtBottom(true);
  }
  const filteredChannels = sortConversations(data).filter((channel) => displayName(channel).toLocaleLowerCase().includes(conversationQuery.toLocaleLowerCase()) && (!unreadOnly || channel.messages.some((message) => isUnread(message, currentMemberId, channel.lastReadAt))));
  const firstUnread = selected?.messages.find((message) => isUnread(message, currentMemberId, unreadBoundaries[selectedId]));

  return <div className="fixed inset-x-0 top-[calc(5rem+env(safe-area-inset-top))] bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 grid min-h-0 overflow-hidden border-y border-border/70 bg-card lg:relative lg:inset-auto lg:z-auto lg:h-[calc(100dvh-5.5rem)] lg:rounded-2xl lg:border lg:shadow-[var(--shadow-card)] lg:grid-cols-[19rem_minmax(0,1fr)]">
    <aside className={cn("min-h-0 min-w-0 flex-col border-r border-border bg-muted/25", mobileShowThread ? "hidden lg:flex" : "flex")}>
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Conversations</h2><NewDirectMessage members={members} currentMemberId={currentMemberId} onCreated={(id) => { if (data.some((channel) => channel.id === id)) selectChannel(id); else { router.push(`/chat?channel=${id}`); router.refresh(); } }} /></div>
        <SearchField value={conversationQuery} onValueChange={setConversationQuery} aria-label="Find a conversation" placeholder="Find a conversation" inputClassName="h-9" />
        <div className="flex gap-1" aria-label="Conversation filters">{[false, true].map((unread) => <Button key={String(unread)} size="sm" variant={unreadOnly === unread ? "secondary" : "ghost"} aria-pressed={unreadOnly === unread} onClick={() => setUnreadOnly(unread)}>{unread ? "Unread" : "All conversations"}</Button>)}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ChannelSection label="Club" channels={filteredChannels.filter((channel) => channel.kind === "club" && !channel.archivedAt)} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        <ChannelSection label="My groups" channels={filteredChannels.filter((channel) => !channel.archivedAt && ["committee", "project", "event"].includes(channel.kind))} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        <ChannelSection label="Direct messages" channels={filteredChannels.filter((channel) => !channel.archivedAt && channel.kind === "dm")} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        <ChannelSection label="Read-only archive" channels={filteredChannels.filter((channel) => Boolean(channel.archivedAt))} {...{ selectedId, currentMemberId, memberById, displayName }} onSelect={selectChannel} />
        {!filteredChannels.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{unreadOnly ? "You’re all caught up." : "No conversations found."}</p>}
      </div>
    </aside>
    <section className={cn("relative min-h-0 min-w-0 flex-col", mobileShowThread ? "flex" : "hidden lg:flex")}>
      {selected ? <>
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-5">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setMobileShowThread(false)} aria-label="Back to conversations"><ArrowLeft /></Button>
          <ChannelIcon kind={selected.kind} /><div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold">{displayName(selected)}</h2><p className="truncate text-xs text-muted-foreground">{selected.rotaryYear ? `${selected.rotaryYear} · ` : ""}{channelDescription(selected)}</p></div>
          <Button variant={searchOpen ? "secondary" : "ghost"} size="icon-sm" aria-label={searchOpen ? "Close message search" : "Search this conversation"} aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); setQuery(""); }}><Search /></Button>
          {selected.kind === "dm" && selected.createdBy === currentMemberId && <DeleteDirectChat channelId={selected.id} name={displayName(selected)} onDeleted={() => { const remaining = data.filter((channel) => channel.id !== selected.id); setData(remaining); setSelectedId(remaining[0]?.id ?? ""); setMobileShowThread(false); router.replace("/chat"); }} />}
        </header>
        {searchOpen ? <ChatSearch key={selectedId} channelId={selectedId} query={query} onQuery={setQuery} memberById={memberById} /> : <>
          <div ref={threadRef} onScroll={() => { const thread = threadRef.current; if (!thread) return; const bottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 60; atBottomRef.current = bottom; setAtBottom(bottom); }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
            {selected.hasEarlierMessages && <div className="mb-4 text-center"><Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => { const first = selected.messages[0]; if (!first) return; const thread = threadRef.current; const height = thread?.scrollHeight ?? 0; const top = thread?.scrollTop ?? 0; try { const earlier = await loadEarlierChatMessagesAction(selected.id, first.createdAt); flushSync(() => setData((previous) => previous.map((channel) => channel.id === selected.id ? { ...channel, messages: [...earlier, ...channel.messages], hasEarlierMessages: earlier.length === 50 } : channel))); if (thread) thread.scrollTop = top + thread.scrollHeight - height; } catch { setError("Unable to load earlier messages."); } })}>{pending ? <Loader2 className="animate-spin" /> : <ChevronDown className="rotate-180" />}Load earlier messages</Button></div>}
            {selected.messages.map((message, index) => <Fragment key={message.id}>
              {(!index || toClubDateString(message.createdAt) !== toClubDateString(selected.messages[index - 1].createdAt)) && <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-border/70" /><span className="text-xs font-medium text-muted-foreground">{chatDayLabel(message.createdAt)}</span><span className="h-px flex-1 bg-border/70" /></div>}
              {message.id === firstUnread?.id && <div className="my-3 border-t border-primary/30 pt-2 text-center text-xs font-semibold text-primary">New messages</div>}
              <MessageRow message={message} previous={selected.messages[index - 1]} messages={selected.messages} memberById={memberById} currentMemberId={currentMemberId} canModerate={canModerate && !selected.archivedAt} onReply={(id) => { setReplies((previous) => ({ ...previous, [selectedId]: id })); textareaRef.current?.focus(); }} onError={setError} readOnly={Boolean(selected.archivedAt)} />
            </Fragment>)}
            {!selected.loaded && <p role="status" className="p-4 text-sm text-muted-foreground">Loading conversation…</p>}{selected.loaded && !selected.messages.length && <EmptyConversation searching={false} name={displayName(selected)} />}
          </div>
          {!atBottom && <div className="absolute bottom-36 inset-x-0 flex justify-center pointer-events-none"><Button size="sm" className="pointer-events-auto shadow-lg" onClick={scrollToLatest}><ChevronDown />{lastMessage && isUnread(lastMessage, currentMemberId, lastReadAt) ? "New messages" : "Back to latest"}</Button></div>}
        </>}
        {selected.archivedAt ? <footer className="flex shrink-0 items-center gap-2 border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground"><Archive className="size-4" />This Rotary-year archive is read-only.</footer> : <footer className="shrink-0 border-t border-border bg-card p-3 sm:p-4">
          {failures[selectedId] && <div role="alert" className="mb-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"><p className="line-clamp-2">{failures[selectedId].body}</p><div className="mt-1 flex items-center justify-between gap-2 text-destructive"><span>{failures[selectedId].error}</span><Button variant="ghost" size="sm" disabled={Boolean(sending)} onClick={() => setFailures((previous) => { const next = { ...previous }; delete next[selectedId]; return next; })}>Dismiss</Button><Button variant="outline" size="sm" disabled={Boolean(sending)} onClick={() => void sendMessage(failures[selectedId])}>Retry</Button></div></div>}
          {replyTo && <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-muted/60 px-3 py-2 text-xs"><Reply className="size-3.5 text-primary" /><span className="min-w-0 flex-1 truncate">Replying to {memberById.get(replyTo.senderId)?.name}: {replyTo.body}</span><Button variant="ghost" size="icon-xs" aria-label="Cancel reply" onClick={() => setReplies((previous) => ({ ...previous, [selectedId]: undefined }))}><X /></Button></div>}
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
            <Textarea ref={textareaRef} value={draft} maxLength={4000} aria-label={`Message ${displayName(selected)}`} onChange={(event) => setDrafts((previous) => ({ ...previous, [selectedId]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) { event.preventDefault(); void sendMessage(); } }} placeholder={`Message ${displayName(selected)}`} rows={1} className="max-h-36 min-h-10 resize-none border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0" />
            <Button size="icon" onClick={() => void sendMessage()} disabled={!draft.trim() || Boolean(sending) || Boolean(failures[selectedId])} aria-label="Send message">{sending === selectedId ? <Loader2 className="animate-spin" /> : <Send />}</Button>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-1.5 flex justify-between gap-2 px-1 text-xs text-muted-foreground"><span className="hidden sm:block">Enter to send · Shift + Enter for a new line</span><span role="status">{sending === selectedId ? "Sending…" : ""}</span>{draft.length > 3500 && <span>{draft.length}/4000</span>}</div>
        </footer>}
      </> : <EmptyConversation name="chat" searching={false} />}
    </section>
  </div>;
}

function DeleteDirectChat({ channelId, name, onDeleted }: { channelId: string; name: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setError(""); }}>
      <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Conversation options" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}><Trash2 />Delete conversation</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this conversation?</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">
          Your conversation with {name} and all of its messages will be permanently deleted for both members. This cannot be undone.
        </p>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={pending} onClick={() => startTransition(async () => {
            setError("");
            try {
              await deleteDirectChatAction(channelId);
              setOpen(false);
              onDeleted();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Unable to delete this conversation.");
            }
          })}>
            {pending ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Trash2 />}
            Delete conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChannelSection({ label, channels, selectedId, currentMemberId, memberById, displayName, onSelect }: { label: string; channels: ChatChannel[]; selectedId: string; currentMemberId: string; memberById: Map<string, Member>; displayName: (channel: ChatChannel) => string; onSelect: (id: string) => void }) {
  if (!channels.length) return null;
  return <div className="mb-5"><p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{label}</p>{channels.map((channel) => {
    const last = channel.messages.findLast((message) => !message.deletedAt); const unread = channel.messages.some((message) => isUnread(message, currentMemberId, channel.lastReadAt)); const otherId = channel.memberIds.find((id) => id !== currentMemberId);
    return <button key={channel.id} onClick={() => onSelect(channel.id)} aria-current={channel.id === selectedId ? "true" : undefined} className={cn("group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted", channel.id === selectedId && "bg-primary/10 text-primary hover:bg-primary/10")}>{channel.kind === "dm" ? <MemberAvatar member={memberById.get(otherId ?? "")} className="size-9 shrink-0" fallbackClassName="text-xs" /> : <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm", channel.id === selectedId && "bg-primary text-primary-foreground")}><ChannelIcon kind={channel.kind} /></div>}<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className={cn("truncate text-sm", unread ? "font-semibold text-foreground" : "font-medium")}>{displayName(channel)}</p>{last && <time className="ml-auto shrink-0 text-[10px] text-muted-foreground" title={formatDateTime(last.createdAt)}>{chatDayLabel(last.createdAt) === "Today" ? chatTime(last.createdAt) : chatDayLabel(last.createdAt).replace(/, \d{4}$/, "")}</time>}{unread && <span aria-label="Unread messages" className="size-2 shrink-0 rounded-full bg-primary" />}</div>{channel.rotaryYear && <p className="mt-0.5 text-[10px] text-muted-foreground">{channel.rotaryYear}</p>}<p className={cn("mt-0.5 truncate text-xs text-muted-foreground", unread && "text-foreground/70")}>{last ? `${memberById.get(last.senderId)?.name.split(" ")[0] ?? "Member"}: ${last.body}` : channel.kind === "dm" ? "Start a conversation" : channelDescription(channel)}</p></div></button>;
  })}</div>;
}

function MessageRow({ message, previous, messages, memberById, currentMemberId, canModerate, onReply, onError, readOnly }: { message: ChatMessage; previous?: ChatMessage; messages: ChatMessage[]; memberById: Map<string, Member>; currentMemberId: string; canModerate: boolean; onReply: (id: string) => void; onError: (error: string) => void; readOnly: boolean }) {
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, startRemoving] = useTransition();
  const sender = memberById.get(message.senderId); const parent = messages.find((item) => item.id === message.replyToId); const compact = previous?.senderId === message.senderId && toClubDateString(previous.createdAt) === toClubDateString(message.createdAt) && new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60_000; const groupedReactions = REACTIONS.map((emoji) => ({ emoji, members: message.reactions.filter((item) => item.emoji === emoji).map((item) => item.memberId) })).filter((item) => item.members.length);
  return <><div className={cn("group relative flex gap-3 rounded-xl py-1.5 pl-2 pr-10 hover:bg-muted/45", !compact && "mt-3 pt-3", message.senderId === currentMemberId && !message.deletedAt && "bg-primary/5")}>{compact ? <div className="w-9 shrink-0 pt-1 text-center text-[10px] text-transparent group-hover:text-muted-foreground">{chatTime(message.createdAt)}</div> : <MemberAvatar member={sender} className="size-9 shrink-0" fallbackClassName="text-xs" />}<div className="min-w-0 flex-1">{!compact && <div className="flex flex-wrap items-baseline gap-x-2 pr-8"><p className="text-sm font-semibold text-foreground">{sender?.name ?? "Former member"}</p><time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="text-xs text-muted-foreground">{chatTime(message.createdAt)}</time></div>}{parent && <button onClick={() => document.getElementById(`message-${parent.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mt-1 block max-w-full truncate border-l-2 border-primary/50 pl-2 text-xs text-muted-foreground hover:text-foreground">{memberById.get(parent.senderId)?.name}: {parent.body}</button>}<p id={`message-${message.id}`} className={cn("whitespace-pre-wrap break-words text-[15px] leading-6 text-foreground", message.deletedAt && "italic text-muted-foreground")}>{message.body}{message.editedAt && !message.deletedAt && <span className="ml-1 text-[10px] text-muted-foreground">(edited)</span>}</p>{groupedReactions.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{groupedReactions.map(({ emoji, members }) => <button key={emoji} disabled={readOnly} onClick={() => void toggleChatReactionAction(message.id, emoji).catch(() => onError("Unable to update that reaction."))} className={cn("rounded-full border bg-background px-2 py-0.5 text-xs hover:border-primary disabled:cursor-default", members.includes(currentMemberId) && "border-primary bg-primary/10")} title={members.map((id) => memberById.get(id)?.name).join(", ")}>{emoji} {members.length}</button>)}</div>}</div>{!readOnly && !message.deletedAt && <div className="absolute right-1 top-1 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Message actions" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onReply(message.id)}><Reply />Reply</DropdownMenuItem><div className="grid grid-cols-5 gap-1 border-y border-border p-2" aria-label="Reactions">{REACTIONS.map((emoji) => <button key={emoji} aria-label={`React ${emoji}`} className="rounded-md p-2 text-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { void toggleChatReactionAction(message.id, emoji).catch(() => onError("Unable to update that reaction.")); }}>{emoji}</button>)}</div>{(message.senderId === currentMemberId || canModerate) && <DropdownMenuItem variant="destructive" onClick={() => setRemoveOpen(true)}><Trash2 />Remove message</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div>}</div><Dialog open={removeOpen} onOpenChange={setRemoveOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Remove this message?</DialogTitle></DialogHeader><p className="text-sm leading-6 text-muted-foreground">The message from {sender?.name ?? "this member"} will be replaced with “Message removed.” This cannot be undone.</p>{canModerate && message.senderId !== currentMemberId && <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300"><ShieldCheck className="mt-0.5 size-4 shrink-0" />You’re removing this message as a board moderator.</div>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removing}>Cancel</Button><Button variant="destructive" disabled={removing} onClick={() => startRemoving(async () => { onError(""); try { await deleteChatMessageAction(message.id); setRemoveOpen(false); } catch (cause) { onError(cause instanceof Error ? cause.message : "Unable to remove that message."); } })}>{removing ? <Loader2 className="animate-spin" /> : <Trash2 />}Remove message</Button></div></DialogContent></Dialog></>;
}

function NewDirectMessage({ members, currentMemberId, onCreated }: { members: Member[]; currentMemberId: string; onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false); const [error, setError] = useState(""); const [query, setQuery] = useState(""); const [pending, startTransition] = useTransition(); const choices = members.filter((member) => member.id !== currentMemberId && member.status === "active" && member.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" size="sm" aria-label="New direct message" />}><MessageCirclePlus /><span>New</span></DialogTrigger><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>New conversation</DialogTitle></DialogHeader><SearchField value={query} onValueChange={setQuery} aria-label="Search club members" placeholder="Search club members" autoFocus />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="max-h-80 overflow-y-auto">{!choices.length && <p className="py-6 text-center text-sm text-muted-foreground">No members match your search.</p>}{choices.map((member) => <button key={member.id} disabled={pending} onClick={() => startTransition(async () => { setError(""); try { const id = await startDirectChatAction(member.id); setOpen(false); onCreated(id); } catch { setError("Unable to start this conversation. Please try again."); } })} className="flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><MemberAvatar member={member} className="size-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.classification}</p></div>{pending ? <Loader2 className="size-4 animate-spin" /> : <ChevronDown className="size-4 -rotate-90 text-muted-foreground" />}</button>)}</div></DialogContent></Dialog>;
}

function ChannelIcon({ kind }: { kind: ChatChannel["kind"] }) { const className = "size-4"; if (kind === "committee") return <Users className={className} />; if (kind === "event") return <CalendarDays className={className} />; if (kind === "project") return <HeartHandshake className={className} />; if (kind === "club") return <ShieldCheck className={className} />; return <Hash className={className} />; }
function channelDescription(channel: ChatChannel) { if (channel.archivedAt) return "Read-only Rotary-year archive"; return { club: "Open to all active club members", committee: "Private committee room", event: "Event conversation", project: "For project volunteers", dm: "Private conversation" }[channel.kind]; }
function EmptyConversation({ searching, name }: { searching: boolean; name: string }) { return <div className="flex h-full min-h-56 flex-col items-center justify-center px-8 text-center"><div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">{searching ? <Search /> : <MessageCirclePlus />}</div><h3 className="text-base font-semibold">{searching ? "No matching messages" : `Start the conversation in ${name}`}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{searching ? "Try a different phrase." : "Share an update, ask a question, or coordinate the next step with your fellow members."}</p></div>; }
