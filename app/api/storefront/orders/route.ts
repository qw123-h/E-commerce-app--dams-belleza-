import {DeliveryMethod, PaymentMethod} from "@prisma/client";
import {NextResponse} from "next/server";
import {createGuestOrder} from "@/lib/storefront-order";
import {createDocumentToken} from "@/lib/document-token";

type RequestPayload = {
  productId?: string;
  quantity?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryMethod?: DeliveryMethod;
  deliveryZoneId?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
};

function badRequest(message: string) {
  return NextResponse.json({message}, {status: 400});
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestPayload | null;

  if (!body) {
    return badRequest("Invalid request body");
  }

  if (!body.productId) {
    return badRequest("Product is required");
  }

  if (!body.quantity || Number.isNaN(body.quantity)) {
    return badRequest("Quantity is required");
  }

  if (!body.customerName?.trim()) {
    return badRequest("Customer name is required");
  }

  if (!body.customerPhone?.trim()) {
    return badRequest("Customer phone is required");
  }

  if (!body.deliveryMethod || (body.deliveryMethod !== DeliveryMethod.PICKUP && body.deliveryMethod !== DeliveryMethod.DELIVERY)) {
    return badRequest("Delivery method is required");
  }

  if (
    !body.paymentMethod ||
    (body.paymentMethod !== PaymentMethod.ORANGE_MONEY &&
      body.paymentMethod !== PaymentMethod.MTN_MOMO &&
      body.paymentMethod !== PaymentMethod.BANK_TRANSFER)
  ) {
    return badRequest("Payment method is required");
  }

  if (
    body.deliveryMethod === DeliveryMethod.DELIVERY &&
    (typeof body.deliveryLatitude !== "number" || typeof body.deliveryLongitude !== "number")
  ) {
    return badRequest("Delivery location is required");
  }

  if (typeof body.deliveryLatitude === "number" && (body.deliveryLatitude < -90 || body.deliveryLatitude > 90)) {
    return badRequest("Delivery latitude is invalid");
  }

  if (typeof body.deliveryLongitude === "number" && (body.deliveryLongitude < -180 || body.deliveryLongitude > 180)) {
    return badRequest("Delivery longitude is invalid");
  }

  try {
    const locationNote =
      body.deliveryMethod === DeliveryMethod.DELIVERY &&
      typeof body.deliveryLatitude === "number" &&
      typeof body.deliveryLongitude === "number"
        ? `Location: ${body.deliveryLatitude.toFixed(6)}, ${body.deliveryLongitude.toFixed(6)} | Map: https://maps.google.com/?q=${body.deliveryLatitude.toFixed(6)},${body.deliveryLongitude.toFixed(6)}`
        : undefined;

    const combinedNotes = [body.notes?.trim(), locationNote].filter(Boolean).join(" | ") || undefined;

    const order = await createGuestOrder({
      productId: body.productId,
      quantity: Math.max(1, Math.floor(body.quantity)),
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim() || undefined,
      deliveryMethod: body.deliveryMethod,
      deliveryZoneId: body.deliveryZoneId?.trim() || undefined,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference?.trim() || undefined,
      notes: combinedNotes,
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount.toString(),
      currency: order.currency,
      invoiceNumber: order.invoiceNumber,
      invoiceToken: order.invoiceNumber ? createDocumentToken("invoice", order.invoiceNumber) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order";
    return NextResponse.json({message}, {status: 400});
  }
}
