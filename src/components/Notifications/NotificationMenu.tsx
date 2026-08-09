"use client";

import { GrNotification } from "react-icons/gr";
import Link from "next/link";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notification = {
  id: string;
  event_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationMenu() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  const openChanged = async (open: boolean) => {
    if (!open) return;
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const result = (await response.json()) as { notifications: Notification[] };
      setItems(result.notifications);
      setLoaded(true);
      if (result.notifications.some((item) => !item.is_read)) {
        void fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        setItems((current) => current.map((item) => ({ ...item, is_read: true })));
      }
    } catch {
      setLoaded(true);
    }
  };

  const unread = items.some((item) => !item.is_read);
  return (
    <Popover onOpenChange={(open) => void openChanged(open)}>
      <PopoverTrigger aria-label="Notifications" className="relative">
        <GrNotification className="text-zinc-500" size={18} />
        {unread ? <span className="absolute -right-1 -top-1 size-2 rounded-full bg-pink-500" /> : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl border-zinc-200 bg-white/95 p-2 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <p className="px-2 py-2 text-sm font-semibold">Notifications</p>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const content = (
              <div className="rounded-lg px-2 py-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-zinc-500">{item.message}</p>
              </div>
            );
            return item.event_id ? <Link href={`/events/${item.event_id}`} key={item.id}>{content}</Link> : <div key={item.id}>{content}</div>;
          })}
          {loaded && !items.length ? <p className="px-2 pb-3 text-xs text-zinc-500">No notifications yet.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
