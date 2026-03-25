"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

type OrderStatus = "PENDING" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

type OrderStatusControlProps = {
  orderId: string;
  currentStatus: OrderStatus;
  labels: {
    update: string;
    updating: string;
    error: string;
    statuses: Record<OrderStatus, string>;
  };
};

export function OrderStatusControl({orderId, currentStatus, labels}: OrderStatusControlProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({status}),
        });

        if (!response.ok) {
          setError(labels.error);
          return;
        }

        router.refresh();
      } catch {
        setError(labels.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="min-w-40 rounded-lg border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        >
          <option value="PENDING">{labels.statuses.PENDING}</option>
          <option value="CONFIRMED">{labels.statuses.CONFIRMED}</option>
          <option value="DISPATCHED">{labels.statuses.DISPATCHED}</option>
          <option value="DELIVERED">{labels.statuses.DELIVERED}</option>
          <option value="CANCELLED">{labels.statuses.CANCELLED}</option>
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-charcoal-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? labels.updating : labels.update}
        </button>
      </div>
      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </form>
  );
}
