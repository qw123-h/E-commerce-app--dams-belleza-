import {NextResponse} from "next/server";
import {listRecentPayments} from "@/lib/admin-payments";

export const dynamic = "force-dynamic";

export async function GET() {
  const payments = await listRecentPayments(120);

  return NextResponse.json({
    payments: payments.map((payment) => ({
      id: payment.id,
      method: payment.method,
      status: payment.status,
      amount: payment.amount.toString(),
      reference: payment.reference,
      rejectedReason: payment.rejectedReason,
      confirmedAt: payment.confirmedAt,
      createdAt: payment.createdAt,
      orderNumber: payment.order.orderNumber,
      deliveryMethod: payment.order.deliveryMethod,
      guestInfo: payment.order.notes?.split("|")[0]?.trim() || "-",
      screenshotUrl: payment.screenshots[0]?.url ?? null,
    })),
  });
}
