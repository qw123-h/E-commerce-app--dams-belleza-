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
  const [zoneList, setZoneList] = useState<Zone[]>(zones);
  const [riderList, setRiderList] = useState<Rider[]>(riders);
  const [zoneName, setZoneName] = useState("");
  const [zoneCity, setZoneCity] = useState("");
  const [zonePrice, setZonePrice] = useState(1000);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id ?? "");
  const [selectedRiderId, setSelectedRiderId] = useState(riders[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{type: "success" | "error"; text: string} | null>(null);

  function showFeedback(type: "success" | "error", text: string) {
    setFeedback({type, text});
    setTimeout(() => setFeedback(null), 3500);
  }

  function createZone() {
    if (!zoneName.trim() || !zoneCity.trim()) {
      showFeedback("error", "Please enter zone and city before adding.");
      return;
    }

    if (!Number.isFinite(Number(zonePrice)) || Number(zonePrice) <= 0) {
      showFeedback("error", "Please enter a valid delivery price.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/delivery/zones", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({zoneName, city: zoneCity, deliveryPrice: Number(zonePrice)}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showFeedback("error", data.message ?? "Could not add zone");
        return;
      }

      if (data.zone) {
        setZoneList((prev) => [...prev, {...data.zone, deliveryPrice: data.zone.deliveryPrice.toString()}]);
      }
      setZoneName("");
      setZoneCity("");
      setZonePrice(1000);
      showFeedback("success", "Zone added");
    });
  }

  function toggleZone(zoneId: string, isActive: boolean) {
    startTransition(async () => {
      const response = await fetch(`/api/delivery/zones/${zoneId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({isActive: !isActive}),
      });

      if (!response.ok) {
        showFeedback("error", "Could not update zone");
        return;
      }

      setZoneList((prev) => prev.map((zone) => (zone.id === zoneId ? {...zone, isActive: !isActive} : zone)));
    });
  }

  function createRiderAction() {
    if (!riderName.trim() || !riderPhone.trim()) {
      showFeedback("error", "Please enter rider name and phone before adding.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/delivery/riders", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({fullName: riderName, phone: riderPhone}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showFeedback("error", data.message ?? "Could not add rider");
        return;
      }

      if (data.rider) {
        setRiderList((prev) => [...prev, data.rider]);
        if (!selectedRiderId) {
          setSelectedRiderId(data.rider.id);
        }
      }
      setRiderName("");
      setRiderPhone("");
      showFeedback("success", "Rider added");
    });
  }

  function toggleRider(riderId: string, isActive: boolean) {
    startTransition(async () => {
      const response = await fetch(`/api/delivery/riders/${riderId}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({isActive: !isActive}),
      });

      if (!response.ok) {
        showFeedback("error", "Could not update rider");
        return;
      }

      setRiderList((prev) => prev.map((rider) => (rider.id === riderId ? {...rider, isActive: !isActive} : rider)));
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
      if (!response.ok) {
        showFeedback("error", "Could not assign rider");
        return;
      }
      window.location.reload();
    });
  }

  function updateDeliveryStatus(deliveryId: string, status: string) {
    startTransition(async () => {
      const response = await fetch(`/api/delivery/${deliveryId}/status`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status}),
      });
      if (!response.ok) {
        showFeedback("error", "Could not update delivery status");
        return;
      }
      window.location.reload();
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      {feedback ? (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold lg:col-span-2 ${feedback.type === "success" ? "border border-green-500/30 bg-green-50 text-green-800" : "border border-red-500/30 bg-red-50 text-red-800"}`}>
          {feedback.text}
        </div>
      ) : null}

      <article className="space-y-4 rounded-3xl border border-charcoal-900/10 bg-cream-50 p-5">
        <h2 className="font-display text-2xl text-charcoal-900">{labels.zones}</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <input value={zoneName} onChange={(event) => setZoneName(event.target.value)} placeholder={labels.zoneName} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <input value={zoneCity} onChange={(event) => setZoneCity(event.target.value)} placeholder={labels.city} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <input type="number" value={zonePrice} onChange={(event) => setZonePrice(Number(event.target.value) || 0)} placeholder={labels.price} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm" />
          <button onClick={createZone} className="rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50">{isPending ? labels.saving : labels.addZone}</button>
        </div>
        <ul className="space-y-2">
          {zoneList.map((zone) => (
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
          {riderList.map((rider) => (
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
            {riderList.filter((rider) => rider.isActive).map((rider) => (
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
