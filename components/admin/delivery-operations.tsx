"use client";

import {useState, useTransition} from "react";

type Zone = {
  id: string;
  zoneName: string;
  city: string;
  deliveryPrice: string;
  isActive: boolean;
};

type Rider = {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
};

type OrderItem = {
  id: string;
  orderNumber: string;
  status: string;
  delivery: {
    id: string;
    status: string;
    riderId: string | null;
    rider: {fullName: string} | null;
  } | null;
};

type Props = {
  zones: Zone[];
  riders: Rider[];
  orders: OrderItem[];
  labels: {
    zones: string;
    riders: string;
    assignments: string;
    addZone: string;
    addRider: string;
    assign: string;
    save: string;
    saving: string;
    city: string;
    zoneName: string;
    price: string;
    riderName: string;
    riderPhone: string;
    order: string;
    rider: string;
    deliveryStatus: string;
  };
};

export function DeliveryOperations({zones, riders, orders, labels}: Props) {
  const [zoneName, setZoneName] = useState("");
  const [zoneCity, setZoneCity] = useState("");
  const [zonePrice, setZonePrice] = useState(1000);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [selectedRiderId, setSelectedRiderId] = useState(riders[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  function refreshHard() {
    window.location.reload();
  }

  function createZone() {
    if (!zoneName.trim() || !zoneCity.trim()) return;

    startTransition(async () => {
      const response = await fetch("/api/delivery/zones", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({zoneName, city: zoneCity, deliveryPrice: Number(zonePrice)}),
      });
      if (response.ok) refreshHard();
    });
  }

  function toggleZone(zoneId: string, isActive: boolean) {
    startTransition(async () => {
      const response = await fetch(`/api/delivery/zones/${zoneId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({isActive: !isActive}),
      });
      if (response.ok) refreshHard();
    });
  }

  function createRiderAction() {
    if (!riderName.trim() || !riderPhone.trim()) return;

    startTransition(async () => {
      const response = await fetch("/api/delivery/riders", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({fullName: riderName, phone: riderPhone}),
      });
      if (response.ok) refreshHard();
    });
  }

  function toggleRider(riderId: string, isActive: boolean) {
    startTransition(async () => {
      const response = await fetch(`/api/delivery/riders/${riderId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({isActive: !isActive}),
      });
      if (response.ok) refreshHard();
    });
  }

  function assignRiderAction() {
    if (!selectedOrderId || !selectedRiderId) return;

    startTransition(async () => {
      const response = await fetch("/api/delivery/assign", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({orderId: selectedOrderId, riderId: selectedRiderId}),
      });
      if (response.ok) refreshHard();
    });
  }

  function updateDeliveryStatus(deliveryId: string, status: string) {
    startTransition(async () => {
      const response = await fetch(`/api/delivery/${deliveryId}/status`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status}),
      });
      if (response.ok) refreshHard();
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
        <h2 className="font-display text-2xl text-charcoal-900">{labels.zones}</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <input value={zoneName} onChange={(event) => setZoneName(event.target.value)} placeholder={labels.zoneName} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <input value={zoneCity} onChange={(event) => setZoneCity(event.target.value)} placeholder={labels.city} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <input type="number" value={zonePrice} onChange={(event) => setZonePrice(Number(event.target.value) || 0)} placeholder={labels.price} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <button onClick={createZone} className="rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50">{isPending ? labels.saving : labels.addZone}</button>
        </div>
        <ul className="space-y-2">
          {zones.map((zone) => (
            <li key={zone.id} className="flex items-center justify-between rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-sm">
              <span>{zone.city} - {zone.zoneName} ({zone.deliveryPrice} XAF)</span>
              <button onClick={() => toggleZone(zone.id, zone.isActive)} className="rounded-lg border border-charcoal-900/20 px-2 py-1 text-xs font-semibold">
                {zone.isActive ? "Active" : "Inactive"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
        <h2 className="font-display text-2xl text-charcoal-900">{labels.riders}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={riderName} onChange={(event) => setRiderName(event.target.value)} placeholder={labels.riderName} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <input value={riderPhone} onChange={(event) => setRiderPhone(event.target.value)} placeholder={labels.riderPhone} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <button onClick={createRiderAction} className="rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50">{isPending ? labels.saving : labels.addRider}</button>
        </div>
        <ul className="space-y-2">
          {riders.map((rider) => (
            <li key={rider.id} className="flex items-center justify-between rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-sm">
              <span>{rider.fullName} ({rider.phone})</span>
              <button onClick={() => toggleRider(rider.id, rider.isActive)} className="rounded-lg border border-charcoal-900/20 px-2 py-1 text-xs font-semibold">
                {rider.isActive ? "Active" : "Inactive"}
              </button>
            </li>
          ))}
        </ul>
      </article>

      <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5 lg:col-span-2">
        <h2 className="font-display text-2xl text-charcoal-900">{labels.assignments}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm">
            {orders.map((order) => (
              <option key={order.id} value={order.id}>{order.orderNumber}</option>
            ))}
          </select>
          <select value={selectedRiderId} onChange={(event) => setSelectedRiderId(event.target.value)} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm">
            {riders.filter((rider) => rider.isActive).map((rider) => (
              <option key={rider.id} value={rider.id}>{rider.fullName}</option>
            ))}
          </select>
          <button onClick={assignRiderAction} className="rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50">{isPending ? labels.saving : labels.assign}</button>
        </div>

        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-sm">
              <span>
                {order.orderNumber} - {order.delivery?.rider?.fullName ?? "No rider"} - {order.delivery?.status ?? "No delivery"}
              </span>
              {order.delivery ? (
                <select
                  value={order.delivery.status}
                  onChange={(event) => updateDeliveryStatus(order.delivery!.id, event.target.value)}
                  className="rounded-lg border border-charcoal-900/20 bg-white px-2 py-1 text-xs font-semibold"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              ) : null}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
