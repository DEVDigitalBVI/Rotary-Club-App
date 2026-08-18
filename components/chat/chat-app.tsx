"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Hash, MoreHorizontal, Send, Trash2, UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { Channel, ChatMessage, Member } from "@/lib/mock-data";

export function ChatApp({
  channels,
  members,
  currentMemberId,
  isAdmin,
}: {
  channels: Channel[];
  members: Member[];
  currentMemberId: string;
  isAdmin: boolean;
}) {
  const [data, setData] = useState(channels);
  const [selectedId, setSelectedId] = useState<string>(channels[0]?.id ?? "");
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [draft, setDraft] = useState("");

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const selected = data.find((c) => c.id === selectedId) ?? data[0];

  function displayName(channel: Channel) {
    if (channel.kind === "channel") return channel.name;
    const other = channel.memberIds.find((id) => id !== currentMemberId);
    return memberById.get(other ?? "")?.name ?? channel.name;
  }

  function sendMessage() {
    if (!draft.trim() || !selected) return;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentMemberId,
      body: draft.trim(),
      timestamp: new Date().toISOString(),
    };
    setData((prev) =>
      prev.map((c) =>
        c.id === selected.id ? { ...c, messages: [...c.messages, message] } : c
      )
    );
    setDraft("");
  }

  function deleteMessage(messageId: string) {
    setData((prev) =>
      prev.map((c) =>
        c.id === selected?.id
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      )
    );
  }

  return (
    <div className="flex h-[75vh] min-h-[420px] overflow-hidden rounded-xl border border-border bg-card">
      {/* Channel / DM list */}
      <aside
        className={cn(
          "w-full shrink-0 flex-col overflow-y-auto border-r border-border md:flex md:w-72",
          mobileShowThread ? "hidden" : "flex"
        )}
      >
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Channels
        </p>
        {data
          .filter((c) => c.kind === "channel")
          .map((c) => (
            <ChatListItem
              key={c.id}
              channel={c}
              active={c.id === selected?.id}
              name={displayName(c)}
              memberById={memberById}
              currentMemberId={currentMemberId}
              onSelect={() => {
                setSelectedId(c.id);
                setMobileShowThread(true);
              }}
            />
          ))}
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Direct messages
        </p>
        {data
          .filter((c) => c.kind === "dm")
          .map((c) => (
            <ChatListItem
              key={c.id}
              channel={c}
              active={c.id === selected?.id}
              name={displayName(c)}
              memberById={memberById}
              currentMemberId={currentMemberId}
              onSelect={() => {
                setSelectedId(c.id);
                setMobileShowThread(true);
              }}
            />
          ))}
      </aside>

      {/* Thread */}
      <section
        className={cn(
          "flex-1 flex-col md:flex",
          mobileShowThread ? "flex" : "hidden"
        )}
      >
        {selected && (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileShowThread(false)}
              >
                <ArrowLeft />
              </Button>
              {selected.kind === "channel" ? (
                <Hash className="size-4 text-muted-foreground" />
              ) : null}
              <p className="font-heading text-sm font-semibold text-foreground">
                {displayName(selected)}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {selected.messages.map((message) => {
                const sender = memberById.get(message.senderId);
                return (
                  <div key={message.id} className="group flex items-start gap-2.5">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback
                        className="text-xs font-semibold text-white"
                        style={{ backgroundColor: sender?.avatarColor }}
                      >
                        {sender?.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="font-heading text-sm font-medium text-foreground">
                          {sender?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(message.timestamp)}
                        </p>
                      </div>
                      <p className="font-body text-sm text-foreground">{message.body}</p>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-xs" />}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => deleteMessage(message.id)}
                          >
                            <Trash2 />
                            Delete message
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive">
                            <UserX />
                            Remove from channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
              {selected.messages.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet — say hello.
                </p>
              )}
            </div>

            <div className="flex items-end gap-2 border-t border-border p-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${displayName(selected)}`}
                rows={1}
                className="min-h-9"
              />
              <Button size="icon" onClick={sendMessage} disabled={!draft.trim()}>
                <Send className="size-4" />
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ChatListItem({
  channel,
  name,
  active,
  memberById,
  currentMemberId,
  onSelect,
}: {
  channel: Channel;
  name: string;
  active: boolean;
  memberById: Map<string, Member>;
  currentMemberId: string;
  onSelect: () => void;
}) {
  const last = channel.messages[channel.messages.length - 1];
  const lastSender = last ? memberById.get(last.senderId) : undefined;
  const otherId = channel.memberIds.find((id) => id !== currentMemberId);
  const other = otherId ? memberById.get(otherId) : undefined;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted",
        active && "bg-accent"
      )}
    >
      {channel.kind === "dm" ? (
        <Avatar className="size-9 shrink-0">
          <AvatarFallback
            className="text-xs font-semibold text-white"
            style={{ backgroundColor: other?.avatarColor }}
          >
            {other?.initials}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Hash className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-heading truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {last ? `${lastSender?.name?.split(" ")[0] ?? ""}: ${last.body}` : "No messages yet"}
        </p>
      </div>
    </button>
  );
}
