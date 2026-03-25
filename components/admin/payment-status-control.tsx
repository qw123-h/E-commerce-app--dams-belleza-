"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";

type PaymentStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "REFUNDED";

type PaymentStatusControlProps = {
  paymentId: string;
  currentStatus: PaymentStatus;
  labels: {
    save: string;
    saving: string;
    rejectReason: string;
    error: string;
    statuses: Record<PaymentStatus, string>;
  };
};

export function PaymentStatusControl({paymentId, currentStatus, labels}: PaymentStatusControlProps) {
  const [status, setStatus] = useState<PaymentStatus>(currentStatus);
  const [rejectedReason, setRejectedReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/payments/${paymentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            rejectedReason: status === "REJECTED" ? rejectedReason : undefined,
          }),
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
          onChange={(event) => setStatus(event.target.value as PaymentStatus)}
          className="min-w-36 rounded-lg border border-charcoal-900/20 bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        >
          <option value="PENDING">{labels.statuses.PENDING}</option>
          <option value="CONFIRMED">{labels.statuses.CONFIRMED}</option>
          <option value="REJECTED">{labels.statuses.REJECTED}</option>
          <option value="REFUNDED">{labels.statuses.REFUNDED}</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-charcoal-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? labels.saving : labels.save}
        </button>
      </div>

      {status === "REJECTED" ? (
        <input
          value={rejectedReason}
          onChange={(event) => setRejectedReason(event.target.value)}
          placeholder={labels.rejectReason}
          className="w-full rounded-lg border border-charcoal-900/20 bg-white px-3 py-2 text-xs text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        />
      ) : null}

      {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
    </form>
  );
}
