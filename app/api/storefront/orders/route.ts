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

  try {
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
      notes: body.notes?.trim() || undefined,
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
