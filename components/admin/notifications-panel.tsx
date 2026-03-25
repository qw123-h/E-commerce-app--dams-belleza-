"use client";

import {useMemo, useState, useTransition} from "react";

type Item = {
  id: string;
  type: "ORDER" | "PAYMENT" | "DELIVERY" | "SYSTEM";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  locale: string;
  initialNotifications: Item[];
  labels: {
    markRead: string;
    markAllRead: string;
    marking: string;
    empty: string;
    unread: string;
    all: string;
  };
};

export function NotificationsPanel({locale, initialNotifications, labels}: Props) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () => (showOnlyUnread ? notifications.filter((item) => !item.isRead) : notifications),
    [notifications, showOnlyUnread]
  );

  function markOne(id: string) {
    startTransition(async () => {
      const response = await fetch(`/api/notifications/${id}`, {method: "PATCH"});
      if (!response.ok) return;
      setNotifications((prev) => prev.map((item) => (item.id === id ? {...item, isRead: true} : item)));
    });
  }

  function markAll() {
    startTransition(async () => {
      const response = await fetch("/api/notifications", {method: "PATCH"});
      if (!response.ok) return;
      setNotifications((prev) => prev.map((item) => ({...item, isRead: true})));
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowOnlyUnread(false)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${
            !showOnlyUnread ? "bg-charcoal-900 text-cream-50" : "border border-charcoal-900/20 bg-white text-charcoal-900"
          }`}
        >
          {labels.all}
        </button>
        <button
          type="button"
          onClick={() => setShowOnlyUnread(true)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${
            showOnlyUnread ? "bg-charcoal-900 text-cream-50" : "border border-charcoal-900/20 bg-white text-charcoal-900"
          }`}
        >
          {labels.unread}
        </button>
        <button
          type="button"
          onClick={markAll}
          className="rounded-full border border-charcoal-900/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-charcoal-900"
        >
          {isPending ? labels.marking : labels.markAllRead}
        </button>
      </div>

      {visible.length ? (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id} className={`rounded-2xl border p-4 ${item.isRead ? "border-charcoal-900/10 bg-cream-50" : "border-rose-gold-500/30 bg-rose-gold-100/30"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-charcoal-600">{item.type}</p>
                  <h3 className="mt-1 text-base font-semibold text-charcoal-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-charcoal-700">{item.body}</p>
                  <p className="mt-2 text-xs text-charcoal-600">
                    {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "fr-FR")}
                  </p>
                </div>
                {!item.isRead ? (
                  <button
                    type="button"
                    onClick={() => markOne(item.id)}
                    className="rounded-full border border-charcoal-900/20 bg-white px-3 py-1 text-xs font-semibold text-charcoal-900"
                  >
                    {isPending ? labels.marking : labels.markRead}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-charcoal-900/20 bg-cream-50 p-8 text-center text-charcoal-700">
          {labels.empty}
        </div>
      )}
    </section>
  );
}
