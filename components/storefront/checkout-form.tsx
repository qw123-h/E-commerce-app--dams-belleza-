"use client";

import {useMemo, useState} from "react";
import {useRouter} from "next/navigation";

type DeliveryZone = {
  id: string;
  city: string;
  zoneName: string;
  deliveryPrice: string;
};

type CheckoutFormProps = {
  locale: string;
  product: {
    id: string;
    name: string;
    unitPrice: string;
    currency: string;
  };
  deliveryZones: DeliveryZone[];
  labels: {
    yourName: string;
    phone: string;
    email: string;
    quantity: string;
    deliveryMethod: string;
    paymentMethod: string;
    paymentReference: string;
    pickup: string;
    delivery: string;
    orangeMoney: string;
    mtnMomo: string;
    bankTransfer: string;
    deliveryZone: string;
    notes: string;
    subtotal: string;
    deliveryFee: string;
    total: string;
    submit: string;
    submitting: string;
    errorFallback: string;
  };
};

export function CheckoutForm({locale, product, deliveryZones, labels}: CheckoutFormProps) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"ORANGE_MONEY" | "MTN_MOMO" | "BANK_TRANSFER">("ORANGE_MONEY");
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitPrice = Number(product.unitPrice);

  const selectedZone = useMemo(
    () => deliveryZones.find((zone) => zone.id === deliveryZoneId),
    [deliveryZoneId, deliveryZones]
  );

  const deliveryFee = deliveryMethod === "DELIVERY" ? Number(selectedZone?.deliveryPrice ?? 0) : 0;
  const subtotal = unitPrice * quantity;
  const total = subtotal + deliveryFee;

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (deliveryMethod === "DELIVERY" && !deliveryZoneId) {
      setError(labels.errorFallback);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          deliveryMethod,
          deliveryZoneId: deliveryMethod === "DELIVERY" ? deliveryZoneId : undefined,
          paymentMethod,
          paymentReference: paymentReference || undefined,
          notes: notes || undefined,
        }),
      });

      const payload = (await response.json()) as {
        orderNumber?: string;
        invoiceNumber?: string | null;
        invoiceToken?: string | null;
        message?: string;
      };

      if (!response.ok || !payload.orderNumber) {
        setError(payload.message ?? labels.errorFallback);
        return;
      }

      const successUrl = new URL(`/${locale}/checkout/success`, window.location.origin);
      successUrl.searchParams.set("order", payload.orderNumber);

      if (payload.invoiceNumber) {
        successUrl.searchParams.set("invoice", payload.invoiceNumber);
      }

      if (payload.invoiceToken) {
        successUrl.searchParams.set("token", payload.invoiceToken);
      }

      router.push(`${successUrl.pathname}${successUrl.search}`);
      router.refresh();
    } catch {
      setError(labels.errorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-6 shadow-xl shadow-charcoal-900/5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.yourName}</span>
          <input
            required
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          />
        </label>

        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.phone}</span>
          <input
            required
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          />
        </label>

        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.email}</span>
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          />
        </label>

        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.quantity}</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          />
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-charcoal-700">{labels.deliveryMethod}</legend>
        <div className="flex gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-charcoal-800">
            <input
              type="radio"
              name="deliveryMethod"
              value="PICKUP"
              checked={deliveryMethod === "PICKUP"}
              onChange={() => setDeliveryMethod("PICKUP")}
            />
            {labels.pickup}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-charcoal-800">
            <input
              type="radio"
              name="deliveryMethod"
              value="DELIVERY"
              checked={deliveryMethod === "DELIVERY"}
              onChange={() => setDeliveryMethod("DELIVERY")}
            />
            {labels.delivery}
          </label>
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.paymentMethod}</span>
          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as "ORANGE_MONEY" | "MTN_MOMO" | "BANK_TRANSFER")
            }
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          >
            <option value="ORANGE_MONEY">{labels.orangeMoney}</option>
            <option value="MTN_MOMO">{labels.mtnMomo}</option>
            <option value="BANK_TRANSFER">{labels.bankTransfer}</option>
          </select>
        </label>

        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.paymentReference}</span>
          <input
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          />
        </label>
      </div>

      {deliveryMethod === "DELIVERY" ? (
        <label className="text-sm text-charcoal-700">
          <span className="mb-1 block font-semibold">{labels.deliveryZone}</span>
          <select
            required
            value={deliveryZoneId}
            onChange={(event) => setDeliveryZoneId(event.target.value)}
            className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
          >
            <option value="">--</option>
            {deliveryZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.city} - {zone.zoneName} (+{formatter.format(Number(zone.deliveryPrice))} XAF)
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="text-sm text-charcoal-700">
        <span className="mb-1 block font-semibold">{labels.notes}</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
        />
      </label>

      <div className="space-y-1 rounded-2xl border border-charcoal-900/10 bg-white p-4 text-sm text-charcoal-800">
        <p>
          {labels.subtotal}: <strong>{formatter.format(subtotal)} {product.currency}</strong>
        </p>
        <p>
          {labels.deliveryFee}: <strong>{formatter.format(deliveryFee)} {product.currency}</strong>
        </p>
        <p className="text-base">
          {labels.total}: <strong>{formatter.format(total)} {product.currency}</strong>
        </p>
      </div>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-charcoal-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
