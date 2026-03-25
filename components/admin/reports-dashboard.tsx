"use client";

import {useMemo, useState, useTransition} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Summary = {
  range: "daily" | "weekly" | "monthly" | "custom";
  from: string;
  to: string;
  kpis: {
    orders: number;
    deliveredOrders: number;
    revenue: number;
    cost: number;
    profit: number;
    avgOrderValue: number;
  };
  productBreakdown: {
    wigsRevenue: number;
    perfumesRevenue: number;
    wigsQty: number;
    perfumesQty: number;
  };
  topProducts: Array<{name: string; qty: number; revenue: number}>;
  lowStock: Array<{name: string; sku: string; quantityOnHand: number}>;
  timeline: Array<{day: string; orders: number; revenue: number; profit: number}>;
};

type Labels = {
  range: string;
  daily: string;
  weekly: string;
  monthly: string;
  custom: string;
  from: string;
  to: string;
  apply: string;
  snapshot: string;
  snapshotting: string;
  exportPdf: string;
  exportExcel: string;
  wigs: string;
  perfumes: string;
  lowStock: string;
};

type Props = {
  locale: string;
  initialSummary: Summary;
  labels: Labels;
};

function formatXaf(value: number, locale: string) {
  return `${new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {maximumFractionDigits: 0}).format(Math.round(value))} XAF`;
}

export function ReportsDashboard({locale, initialSummary, labels}: Props) {
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [range, setRange] = useState<Summary["range"]>(initialSummary.range);
  const [from, setFrom] = useState(initialSummary.from.slice(0, 10));
  const [to, setTo] = useState(initialSummary.to.slice(0, 10));
  const [isPending, startTransition] = useTransition();

  const pieData = useMemo(
    () => [
      {name: labels.wigs, value: summary.productBreakdown.wigsRevenue},
      {name: labels.perfumes, value: summary.productBreakdown.perfumesRevenue},
    ],
    [labels.perfumes, labels.wigs, summary.productBreakdown.perfumesRevenue, summary.productBreakdown.wigsRevenue]
  );

  function onApply() {
    startTransition(async () => {
      const query = new URLSearchParams({range});
      if (range === "custom") {
        query.set("from", from);
        query.set("to", to);
      }

      const response = await fetch(`/api/reports?${query.toString()}`);
      if (!response.ok) return;
      const payload = (await response.json()) as Summary;
      setSummary(payload);
    });
  }

  function onSnapshot() {
    startTransition(async () => {
      await fetch("/api/reports", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({range, from, to}),
      });
    });
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4 shadow-lg shadow-charcoal-900/5">
        <div className="grid gap-3 md:grid-cols-6">
          <label className="text-sm text-charcoal-700">
            <span className="mb-1 block font-semibold">{labels.range}</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as Summary["range"])}
              className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2"
            >
              <option value="daily">{labels.daily}</option>
              <option value="weekly">{labels.weekly}</option>
              <option value="monthly">{labels.monthly}</option>
              <option value="custom">{labels.custom}</option>
            </select>
          </label>
          <label className="text-sm text-charcoal-700">
            <span className="mb-1 block font-semibold">{labels.from}</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2" />
          </label>
          <label className="text-sm text-charcoal-700">
            <span className="mb-1 block font-semibold">{labels.to}</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2" />
          </label>
          <button onClick={onApply} className="rounded-xl bg-charcoal-900 px-3 py-2 text-sm font-semibold text-cream-50 md:mt-6">{labels.apply}</button>
          <button onClick={onSnapshot} className="rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-sm font-semibold text-charcoal-900 md:mt-6">{isPending ? labels.snapshotting : labels.snapshot}</button>
          <div className="flex gap-2 md:mt-6">
            <a className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-center text-xs font-semibold" href={`/api/reports/export?format=pdf&range=${range}&from=${from}&to=${to}`}>{labels.exportPdf}</a>
            <a className="w-full rounded-xl border border-charcoal-900/20 bg-white px-3 py-2 text-center text-xs font-semibold" href={`/api/reports/export?format=xlsx&range=${range}&from=${from}&to=${to}`}>{labels.exportExcel}</a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4"><p className="text-xs uppercase tracking-[0.1em] text-charcoal-600">Revenue</p><p className="mt-2 text-2xl font-semibold">{formatXaf(summary.kpis.revenue, locale)}</p></article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4"><p className="text-xs uppercase tracking-[0.1em] text-charcoal-600">Profit</p><p className="mt-2 text-2xl font-semibold">{formatXaf(summary.kpis.profit, locale)}</p></article>
        <article className="rounded-2xl border border-charcoal-900/10 bg-cream-50 p-4"><p className="text-xs uppercase tracking-[0.1em] text-charcoal-600">Avg order</p><p className="mt-2 text-2xl font-semibold">{formatXaf(summary.kpis.avgOrderValue, locale)}</p></article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-charcoal-700">Timeline</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#c69a7a" />
                <Bar dataKey="profit" fill="#2e2e2e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-charcoal-700">Mix</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} fill="#c69a7a" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-charcoal-700">Top products</h3>
          <ul className="space-y-2 text-sm">
            {summary.topProducts.map((item) => (
              <li key={item.name} className="flex items-center justify-between border-b border-charcoal-900/10 pb-2">
                <span>{item.name} ({item.qty})</span>
                <span className="font-semibold">{formatXaf(item.revenue, locale)}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-charcoal-900/10 bg-cream-50 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-charcoal-700">{labels.lowStock}</h3>
          <ul className="space-y-2 text-sm">
            {summary.lowStock.map((item) => (
              <li key={item.sku} className="flex items-center justify-between border-b border-charcoal-900/10 pb-2">
                <span>{item.name} ({item.sku})</span>
                <span className="font-semibold">{item.quantityOnHand}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
