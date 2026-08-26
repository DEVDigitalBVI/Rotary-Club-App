export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationPreferences = {
  announcements: boolean;
  events: boolean;
  service: boolean;
  chat: boolean;
  administration: boolean;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  announcements: true,
  events: true,
  service: true,
  chat: true,
  administration: true,
};

export function toNotification(row: NotificationRow): Notification {
  return { id: row.id, type: row.type, title: row.title, body: row.body, link: row.link, read: row.read_at !== null, createdAt: row.created_at };
}
