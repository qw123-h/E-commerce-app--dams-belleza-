import {NextResponse} from "next/server";
import {listRecentOrders} from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await listRecentOrders(100);

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryMethod: order.deliveryMethod,
      subtotalAmount: order.subtotalAmount.toString(),
      deliveryAmount: order.deliveryAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      createdAt: order.createdAt,
      notes: order.notes,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
      })),
      deliveryZone: order.deliveryZone
        ? `${order.deliveryZone.city} - ${order.deliveryZone.zoneName}`
        : null,
    })),
  });
}
