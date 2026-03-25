import {OrderStatus} from "@prisma/client";
import {NextResponse} from "next/server";
import {updateOrderStatus} from "@/lib/admin-orders";

type RequestBody = {
  status?: string;
};

const ALLOWED_STATUSES = new Set<string>([
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.DISPATCHED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]);

export async function PATCH(request: Request, context: {params: {orderId: string}}) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;

  if (!body?.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({message: "Invalid status"}, {status: 400});
  }

  try {
    const updated = await updateOrderStatus(context.params.orderId, body.status as OrderStatus);
    return NextResponse.json({
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch {
    return NextResponse.json({message: "Could not update order status"}, {status: 400});
  }
}
