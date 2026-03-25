import React from "react";
import {Document, Page, StyleSheet, Text, View, renderToBuffer} from "@react-pdf/renderer";

type Item = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type InvoicePayload = {
  locale: "en" | "fr";
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: Date;
  customer: string;
  paymentMethod: string;
  paymentReference: string | null;
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  items: Item[];
};

type ReceiptPayload = {
  locale: "en" | "fr";
  receiptNumber: string;
  orderNumber: string;
  issuedAt: Date;
  paymentMethod: string;
  paymentReference: string | null;
  amount: number;
  currency: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    color: "#1f1f1f",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666666",
  },
  block: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    marginTop: 8,
    paddingBottom: 4,
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
  },
  colName: {
    width: "42%",
  },
  colQty: {
    width: "16%",
    textAlign: "right",
  },
  colUnit: {
    width: "20%",
    textAlign: "right",
  },
  colTotal: {
    width: "22%",
    textAlign: "right",
  },
});

function formatAmount(amount: number, locale: "en" | "fr", currency: string) {
  const intlLocale = locale === "en" ? "en-US" : "fr-FR";
  return `${new Intl.NumberFormat(intlLocale).format(Math.round(amount))} ${currency}`;
}

function InvoicePdf(payload: InvoicePayload) {
  const t = payload.locale === "fr"
    ? {
        invoice: "Facture",
        issuedAt: "Date",
        order: "Commande",
        customer: "Client",
        payment: "Paiement",
        reference: "Reference",
        delivery: "Livraison",
        item: "Article",
        qty: "Qte",
        unit: "Prix unitaire",
        total: "Total",
        subtotal: "Sous-total",
        deliveryFee: "Frais livraison",
        grandTotal: "Total a payer",
      }
    : {
        invoice: "Invoice",
        issuedAt: "Issued",
        order: "Order",
        customer: "Customer",
        payment: "Payment",
        reference: "Reference",
        delivery: "Delivery",
        item: "Item",
        qty: "Qty",
        unit: "Unit price",
        total: "Total",
        subtotal: "Subtotal",
        deliveryFee: "Delivery fee",
        grandTotal: "Grand total",
      };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Dam's belleza</Text>
          <Text style={styles.subtitle}>Yaounde - Mokolo</Text>
        </View>

        <View style={styles.block}>
          <Text>{t.invoice}: {payload.invoiceNumber}</Text>
          <Text>{t.issuedAt}: {payload.issuedAt.toISOString().slice(0, 10)}</Text>
          <Text>{t.order}: {payload.orderNumber}</Text>
          <Text>{t.customer}: {payload.customer}</Text>
          <Text>{t.payment}: {payload.paymentMethod}</Text>
          <Text>{t.reference}: {payload.paymentReference ?? "-"}</Text>
          <Text>{t.delivery}: {payload.deliveryMethod}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colName}>{t.item}</Text>
          <Text style={styles.colQty}>{t.qty}</Text>
          <Text style={styles.colUnit}>{t.unit}</Text>
          <Text style={styles.colTotal}>{t.total}</Text>
        </View>

        {payload.items.map((item) => (
          <View key={`${item.name}-${item.quantity}`} style={styles.tableRow}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{formatAmount(item.unitPrice, payload.locale, payload.currency)}</Text>
            <Text style={styles.colTotal}>{formatAmount(item.totalPrice, payload.locale, payload.currency)}</Text>
          </View>
        ))}

        <View style={{marginTop: 12}}>
          <View style={styles.row}>
            <Text>{t.subtotal}</Text>
            <Text>{formatAmount(payload.subtotal, payload.locale, payload.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text>{t.deliveryFee}</Text>
            <Text>{formatAmount(payload.deliveryFee, payload.locale, payload.currency)}</Text>
          </View>
          <View style={styles.row}>
            <Text>{t.grandTotal}</Text>
            <Text>{formatAmount(payload.total, payload.locale, payload.currency)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function ReceiptPdf(payload: ReceiptPayload) {
  const t = payload.locale === "fr"
    ? {
        receipt: "Recu",
        order: "Commande",
        issuedAt: "Date",
        payment: "Paiement",
        reference: "Reference",
        amount: "Montant",
      }
    : {
        receipt: "Receipt",
        order: "Order",
        issuedAt: "Issued",
        payment: "Payment",
        reference: "Reference",
        amount: "Amount",
      };

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Dam's belleza</Text>
          <Text style={styles.subtitle}>Yaounde - Mokolo</Text>
        </View>

        <View style={styles.block}>
          <Text>{t.receipt}: {payload.receiptNumber}</Text>
          <Text>{t.order}: {payload.orderNumber}</Text>
          <Text>{t.issuedAt}: {payload.issuedAt.toISOString().slice(0, 10)}</Text>
          <Text>{t.payment}: {payload.paymentMethod}</Text>
          <Text>{t.reference}: {payload.paymentReference ?? "-"}</Text>
          <Text>{t.amount}: {formatAmount(payload.amount, payload.locale, payload.currency)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(payload: InvoicePayload) {
  return renderToBuffer(<InvoicePdf {...payload} />);
}

export async function renderReceiptPdf(payload: ReceiptPayload) {
  return renderToBuffer(<ReceiptPdf {...payload} />);
}
