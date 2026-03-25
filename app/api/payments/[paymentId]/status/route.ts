import {PaymentStatus} from "@prisma/client";
import {NextResponse} from "next/server";
import {updatePaymentStatus} from "@/lib/admin-payments";
import {createDocumentToken} from "@/lib/document-token";

type RequestBody = {
  status?: string;
  rejectedReason?: string;
};

const ALLOWED = new Set<string>([
  PaymentStatus.PENDING,
  PaymentStatus.CONFIRMED,
  PaymentStatus.REJECTED,
  PaymentStatus.REFUNDED,
]);

export async function PATCH(request: Request, context: {params: {paymentId: string}}) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;

  if (!body?.status || !ALLOWED.has(body.status)) {
    return NextResponse.json({message: "Invalid payment status"}, {status: 400});
  }

  try {
    const result = await updatePaymentStatus(
      context.params.paymentId,
      body.status as PaymentStatus,
      body.rejectedReason?.trim() || undefined
    );

    return NextResponse.json({
      paymentId: result.id,
      status: result.status,
      updatedAt: result.updatedAt,
      receiptNumber: result.receiptNumber,
      receiptToken: result.receiptNumber ? createDocumentToken("receipt", result.receiptNumber) : null,
    });
  } catch {
    return NextResponse.json({message: "Could not update payment status"}, {status: 400});
  }
}
