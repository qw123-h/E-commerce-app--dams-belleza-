"use client";

import {useMemo, useRef, useState} from "react";
import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";

const DeliveryLocationPickerMap = dynamic(
  () => import("@/components/storefront/delivery-location-picker-map").then((module) => module.DeliveryLocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl border border-charcoal-900/20 bg-white" />
    ),
  }
);

type DeliveryZone = {
  id: string;
  city: string;
  zoneName: string;
  deliveryPrice: string;
};

const STATIC_ZONE_COORDINATES: Record<string, [number, number]> = {
  "douala|bonamoussadi": [4.07252, 9.75735],
  "yaounde|bastos": [3.89812, 11.51723],
  "yaounde|mokolo centre": [3.86791, 11.51584],
  "yaounde|odza carrefour": [3.77592, 11.54829],
};

const STATIC_CITY_COORDINATES: Record<string, [number, number]> = {
  yaounde: [3.84803, 11.50208],
  douala: [4.05106, 9.76787],
};

function normalizeLocationPart(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function getStaticCoordinates(zone: DeliveryZone): [number, number] | null {
  const cityKey = normalizeLocationPart(zone.city);
  const zoneKey = normalizeLocationPart(zone.zoneName);
  const zoneMatch = STATIC_ZONE_COORDINATES[`${cityKey}|${zoneKey}`];

  if (zoneMatch) {
    return zoneMatch;
  }

  return STATIC_CITY_COORDINATES[cityKey] ?? null;
}

type CheckoutFormProps = {
  locale: string;
  product: {
    id: string;
    name: string;
    unitPrice: string;
    currency: string;
  };
  storeWhatsAppNumber: string;
  authenticatedCustomerName?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialCustomerEmail?: string;
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
    deliveryLocationTitle: string;
    deliveryLocationHelp: string;
    useCurrentLocation: string;
    detectingLocation: string;
    locationUnsupported: string;
    locationPermissionDenied: string;
    locationRequired: string;
    locationSelected: string;
    mapClickHint: string;
    selectedAddress: string;
    resolvingAddress: string;
    addressUnavailable: string;
    latitude: string;
    longitude: string;
    zoneAutoFillHint: string;
    notes: string;
    subtotal: string;
    deliveryFee: string;
    total: string;
    submit: string;
    submitting: string;
    errorFallback: string;
  };
};

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, "");
}

function buildWhatsAppMessage(input: {
  locale: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  deliveryMethod: "PICKUP" | "DELIVERY";
}) {
  const deliveryText =
    input.deliveryMethod === "DELIVERY"
      ? input.locale === "fr"
        ? "livraison a domicile"
        : "home delivery"
      : input.locale === "fr"
        ? "retrait en boutique"
        : "store pickup";

  if (input.locale === "fr") {
    return [
      "Bonjour equipe Dam's belleza,",
      `Je m'appelle ${input.customerName}.`,
      `Je viens de passer la commande ${input.orderNumber} dans l'application pour ${input.quantity} x ${input.productName}.`,
      `Mode souhaite: ${deliveryText}.`,
      "Merci de confirmer les prochaines etapes.",
    ].join("\n");
  }

  return [
    "Hello Dam's belleza team,",
    `My name is ${input.customerName}.`,
    `I have just placed order ${input.orderNumber} in the app for ${input.quantity} x ${input.productName}.`,
    `Preferred fulfillment: ${deliveryText}.`,
    "Please confirm the next steps. Thank you.",
  ].join("\n");
}

export function CheckoutForm({
  locale,
  product,
  storeWhatsAppNumber,
  authenticatedCustomerName,
  initialCustomerName,
  initialCustomerPhone,
  initialCustomerEmail,
  deliveryZones,
  labels,
}: CheckoutFormProps) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState(initialCustomerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone ?? "");
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail ?? "");
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"ORANGE_MONEY" | "MTN_MOMO" | "BANK_TRANSFER">("ORANGE_MONEY");
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.848, 11.502]);
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isResolvingZone, setIsResolvingZone] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
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
  const hasSelectedLocation = deliveryLatitude !== null && deliveryLongitude !== null;
  const latestLookupTokenRef = useRef(0);
  const latestZoneLookupTokenRef = useRef(0);

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

    if (deliveryMethod === "DELIVERY" && !hasSelectedLocation) {
      setError(labels.locationRequired);
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
          deliveryLatitude: deliveryMethod === "DELIVERY" ? deliveryLatitude : undefined,
          deliveryLongitude: deliveryMethod === "DELIVERY" ? deliveryLongitude : undefined,
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

      const whatsappNumber = normalizeWhatsAppNumber(storeWhatsAppNumber);
      if (whatsappNumber) {
        const resolvedCustomerName = (authenticatedCustomerName || customerName || "Customer").trim();
        const whatsappMessage = buildWhatsAppMessage({
          locale,
          customerName: resolvedCustomerName,
          orderNumber: payload.orderNumber,
          productName: product.name,
          quantity,
          deliveryMethod,
        });
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        successUrl.searchParams.set("wa", whatsappUrl);

        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (popup) {
          popup.opener = null;
        }
      }

      router.push(`${successUrl.pathname}${successUrl.search}`);
      router.refresh();
    } catch {
      setError(labels.errorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateSelectedLocation(latitude: number, longitude: number) {
    const normalizedLatitude = Number(latitude.toFixed(6));
    const normalizedLongitude = Number(longitude.toFixed(6));

    setDeliveryLatitude(normalizedLatitude);
    setDeliveryLongitude(normalizedLongitude);
    setMapCenter([normalizedLatitude, normalizedLongitude]);
    setLocationError(null);
    void resolveAddress(normalizedLatitude, normalizedLongitude);
  }

  async function resolveAddress(latitude: number, longitude: number) {
    const lookupToken = Date.now();
    latestLookupTokenRef.current = lookupToken;
    setIsResolvingAddress(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        if (latestLookupTokenRef.current === lookupToken) {
          setResolvedAddress("");
        }
        return;
      }

      const payload = (await response.json()) as {
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          country?: string;
        };
      };

      if (latestLookupTokenRef.current !== lookupToken) {
        return;
      }

      const fallbackParts = [
        payload.address?.city || payload.address?.town || payload.address?.village,
        payload.address?.state,
        payload.address?.country,
      ].filter(Boolean);

      const readableAddress = payload.display_name || fallbackParts.join(", ");
      setResolvedAddress(readableAddress || "");
    } catch {
      if (latestLookupTokenRef.current === lookupToken) {
        setResolvedAddress("");
      }
    } finally {
      if (latestLookupTokenRef.current === lookupToken) {
        setIsResolvingAddress(false);
      }
    }
  }

  async function tryResolveZoneCoordinates(zoneId: string) {
    const zone = deliveryZones.find((item) => item.id === zoneId);
    if (!zone) {
      return;
    }

    setResolvedAddress(`${zone.zoneName}, ${zone.city}, Cameroon`);
    setLocationError(null);

    const staticCoordinates = getStaticCoordinates(zone);
    let hasAnyCoordinates = false;

    if (staticCoordinates) {
      hasAnyCoordinates = true;
      updateSelectedLocation(staticCoordinates[0], staticCoordinates[1]);
    }

    const lookupToken = Date.now();
    latestZoneLookupTokenRef.current = lookupToken;
    setIsResolvingZone(true);

    try {
      const query = encodeURIComponent(`${zone.zoneName}, ${zone.city}, Cameroon`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`
      );

      if (!response.ok || latestZoneLookupTokenRef.current !== lookupToken) {
        return;
      }

      const payload = (await response.json()) as Array<{lat: string; lon: string}>;
      const first = payload[0];

      if (!first) {
        if (!hasAnyCoordinates) {
          setLocationError(labels.addressUnavailable);
        }
        return;
      }

      const latitude = Number(first.lat);
      const longitude = Number(first.lon);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        hasAnyCoordinates = true;
        updateSelectedLocation(latitude, longitude);
      }
    } catch {
      if (!hasAnyCoordinates) {
        setLocationError(labels.addressUnavailable);
      }
    } finally {
      if (latestZoneLookupTokenRef.current === lookupToken) {
        setIsResolvingZone(false);
      }
    }
  }

  function updateManualCoordinate(type: "lat" | "lng", value: string) {
    if (value.trim() === "") {
      if (type === "lat") {
        setDeliveryLatitude(null);
      } else {
        setDeliveryLongitude(null);
      }
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    if (type === "lat") {
      setDeliveryLatitude(parsed);
    } else {
      setDeliveryLongitude(parsed);
    }
  }

  function applyManualCoordinates() {
    if (deliveryLatitude === null || deliveryLongitude === null) {
      return;
    }

    updateSelectedLocation(deliveryLatitude, deliveryLongitude);
  }

  function handleUseCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(labels.locationUnsupported);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateSelectedLocation(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError(labels.locationPermissionDenied);
        } else {
          setLocationError(labels.errorFallback);
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
        <div className="space-y-4">
          <label className="text-sm text-charcoal-700">
            <span className="mb-1 block font-semibold">{labels.deliveryZone}</span>
            <select
              required
              value={deliveryZoneId}
              onChange={(event) => {
                const nextZoneId = event.target.value;
                setDeliveryZoneId(nextZoneId);

                if (!nextZoneId) {
                  setDeliveryLatitude(null);
                  setDeliveryLongitude(null);
                  setResolvedAddress("");
                  return;
                }

                if (nextZoneId) {
                  void tryResolveZoneCoordinates(nextZoneId);
                }
              }}
              className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-charcoal-900 outline-none ring-rose-gold-300/70 transition focus:ring"
            >
              <option value="">--</option>
              {deliveryZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.city} - {zone.zoneName} (+{formatter.format(Number(zone.deliveryPrice))} XAF)
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-charcoal-600">
              {isResolvingZone ? labels.resolvingAddress : labels.zoneAutoFillHint}
            </p>
          </label>

          <section className="space-y-2 rounded-xl border border-charcoal-900/10 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-charcoal-800">{labels.deliveryLocationTitle}</p>
                <p className="text-xs text-charcoal-600">{labels.deliveryLocationHelp}</p>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="rounded-lg border border-charcoal-900/20 px-3 py-1.5 text-xs font-semibold text-charcoal-900 disabled:opacity-60"
              >
                {isLocating ? labels.detectingLocation : labels.useCurrentLocation}
              </button>
            </div>

            <p className="text-xs text-charcoal-600">{labels.mapClickHint}</p>

            <DeliveryLocationPickerMap
              center={mapCenter}
              selectedLocation={hasSelectedLocation ? [deliveryLatitude, deliveryLongitude] : null}
              onSelectLocation={updateSelectedLocation}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-charcoal-700">
                <span className="mb-1 block font-semibold">{labels.latitude}</span>
                <input
                  type="number"
                  step="0.000001"
                  value={deliveryLatitude ?? ""}
                  onChange={(event) => updateManualCoordinate("lat", event.target.value)}
                  onBlur={applyManualCoordinates}
                  className="w-full rounded-lg border border-charcoal-900/20 px-2 py-1.5 text-charcoal-900"
                />
              </label>
              <label className="text-xs text-charcoal-700">
                <span className="mb-1 block font-semibold">{labels.longitude}</span>
                <input
                  type="number"
                  step="0.000001"
                  value={deliveryLongitude ?? ""}
                  onChange={(event) => updateManualCoordinate("lng", event.target.value)}
                  onBlur={applyManualCoordinates}
                  className="w-full rounded-lg border border-charcoal-900/20 px-2 py-1.5 text-charcoal-900"
                />
              </label>
            </div>

            <p className="text-xs text-charcoal-700">
              {hasSelectedLocation
                ? `${labels.locationSelected}: ${deliveryLatitude?.toFixed(6)}, ${deliveryLongitude?.toFixed(6)}`
                : labels.locationRequired}
            </p>

            <p className="text-xs text-charcoal-700">
              {isResolvingAddress
                ? `${labels.selectedAddress}: ${labels.resolvingAddress}`
                : `${labels.selectedAddress}: ${resolvedAddress || labels.addressUnavailable}`}
            </p>

            {locationError ? <p className="text-xs font-semibold text-red-700">{locationError}</p> : null}
          </section>
        </div>
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
