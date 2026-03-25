import {NotificationType, OrderStatus} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {notifyUsersWithPermission} from "@/lib/notifications";

export async function listRecentOrders(limit = 50) {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      deliveryMethod: true,
      subtotalAmount: true,
      deliveryAmount: true,
      totalAmount: true,
      createdAt: true,
      notes: true,
      items: {
        select: {
          quantity: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
      deliveryZone: {
        select: {
          city: true,
          zoneName: true,
        },
      },
    },
  });
}

export async function getOrderMetrics() {
  const [totalOrders, pendingOrders, confirmedOrders, deliveredOrders] = await Promise.all([
    prisma.order.count({where: {deletedAt: null}}),
    prisma.order.count({where: {deletedAt: null, status: OrderStatus.PENDING}}),
    prisma.order.count({where: {deletedAt: null, status: OrderStatus.CONFIRMED}}),
    prisma.order.count({where: {deletedAt: null, status: OrderStatus.DELIVERED}}),
  ]);

  return {
    totalOrders,
    pendingOrders,
    confirmedOrders,
    deliveredOrders,
  };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updated = await prisma.order.update({
    where: {id: orderId},
    data: {status},
    select: {
      id: true,
      orderNumber: true,
      status: true,
      updatedAt: true,
    },
  });

  await notifyUsersWithPermission("orders.read", {
    type: NotificationType.ORDER,
    title: `Order ${updated.orderNumber} updated`,
    body: `Status changed to ${updated.status}.`,
    metadata: {
      orderNumber: updated.orderNumber,
      status: updated.status,
    },
  });

  return updated;
}
