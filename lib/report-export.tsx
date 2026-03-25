import React from "react";
import {Document, Page, StyleSheet, Text, View, renderToBuffer} from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import type {ReportSummary} from "@/lib/reports";

const styles = StyleSheet.create({
  page: {padding: 28, fontSize: 11, color: "#1f1f1f"},
  title: {fontSize: 17, marginBottom: 4},
  subtitle: {fontSize: 10, color: "#666", marginBottom: 10},
  section: {marginBottom: 8},
  row: {flexDirection: "row", justifyContent: "space-between", marginBottom: 3},
});

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR", {maximumFractionDigits: 0}).format(Math.round(value))} XAF`;
}

function DashboardReportPdf({summary}: {summary: ReportSummary}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Dam's belleza - Business Report</Text>
        <Text style={styles.subtitle}>
          {summary.from.toISOString().slice(0, 10)} to {summary.to.toISOString().slice(0, 10)} ({summary.range})
        </Text>

        <View style={styles.section}>
          <Text>KPIs</Text>
          <View style={styles.row}><Text>Orders</Text><Text>{summary.kpis.orders}</Text></View>
          <View style={styles.row}><Text>Delivered</Text><Text>{summary.kpis.deliveredOrders}</Text></View>
          <View style={styles.row}><Text>Revenue</Text><Text>{formatAmount(summary.kpis.revenue)}</Text></View>
          <View style={styles.row}><Text>Cost</Text><Text>{formatAmount(summary.kpis.cost)}</Text></View>
          <View style={styles.row}><Text>Profit</Text><Text>{formatAmount(summary.kpis.profit)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text>Top Products</Text>
          {summary.topProducts.map((product) => (
            <View key={product.name} style={styles.row}>
              <Text>{product.name} ({product.qty})</Text>
              <Text>{formatAmount(product.revenue)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text>Low Stock Alerts</Text>
          {summary.lowStock.map((item) => (
            <View key={item.sku} style={styles.row}>
              <Text>{item.name} ({item.sku})</Text>
              <Text>{item.quantityOnHand}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function buildReportPdf(summary: ReportSummary) {
  return renderToBuffer(<DashboardReportPdf summary={summary} />);
}

export function buildReportWorkbook(summary: ReportSummary) {
  const workbook = XLSX.utils.book_new();

  const kpiSheet = XLSX.utils.json_to_sheet([
    {metric: "orders", value: summary.kpis.orders},
    {metric: "delivered_orders", value: summary.kpis.deliveredOrders},
    {metric: "revenue_xaf", value: Math.round(summary.kpis.revenue)},
    {metric: "cost_xaf", value: Math.round(summary.kpis.cost)},
    {metric: "profit_xaf", value: Math.round(summary.kpis.profit)},
    {metric: "avg_order_value_xaf", value: Math.round(summary.kpis.avgOrderValue)},
  ]);

  const timelineSheet = XLSX.utils.json_to_sheet(summary.timeline);
  const topSheet = XLSX.utils.json_to_sheet(summary.topProducts);
  const lowStockSheet = XLSX.utils.json_to_sheet(summary.lowStock);

  XLSX.utils.book_append_sheet(workbook, kpiSheet, "kpis");
  XLSX.utils.book_append_sheet(workbook, timelineSheet, "timeline");
  XLSX.utils.book_append_sheet(workbook, topSheet, "top_products");
  XLSX.utils.book_append_sheet(workbook, lowStockSheet, "low_stock");

  return workbook;
}
