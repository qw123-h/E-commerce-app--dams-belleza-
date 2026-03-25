import {DeliveryStatus, OrderStatus} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {notifyUsersWithPermission} from "@/lib/notifications";

export async function listDeliveryZones() {
  return prisma.deliveryZone.findMany({
    where: {deletedAt: null},
    orderBy: [{city: "asc"}, {zoneName: "asc"}],
  });
}

export async function createDeliveryZone(input: {
  zoneName: string;
  city: string;
  deliveryPrice: number;
  isActive?: boolean;
}) {
  return prisma.deliveryZone.create({
    data: {
      zoneName: input.zoneName,
      city: input.city,
      deliveryPrice: input.deliveryPrice,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateDeliveryZone(
  zoneId: string,
  input: Partial<{zoneName: string; city: string; deliveryPrice: number; isActive: boolean}>
) {
  return prisma.deliveryZone.update({
    where: {id: zoneId},
    data: {
      ...(input.zoneName ? {zoneName: input.zoneName} : {}),
      ...(input.city ? {city: input.city} : {}),
      ...(typeof input.deliveryPrice === "number" ? {deliveryPrice: input.deliveryPrice} : {}),
      ...(typeof input.isActive === "boolean" ? {isActive: input.isActive} : {}),
    },
  });
}

export async function listRiders() {
  return prisma.rider.findMany({
    orderBy: [{isActive: "desc"}, {fullName: "asc"}],
  });
}

export async function createRider(input: {fullName: string; phone: string}) {
  return prisma.rider.create({
    data: {
      fullName: input.fullName,
      phone: input.phone,
    },
  });
}

export async function updateRider(riderId: string, input: Partial<{fullName: string; phone: string; isActive: boolean}>) {
  return prisma.rider.update({
    where: {id: riderId},
    data: {
      ...(input.fullName ? {fullName: input.fullName} : {}),
      ...(input.phone ? {phone: input.phone} : {}),
      ...(typeof input.isActive === "boolean" ? {isActive: input.isActive} : {}),
    },
  });
}

export async function listAssignableOrders(limit = 60) {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [OrderStatus.CONFIRMED, OrderStatus.DISPATCHED],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      delivery: {
        select: {
          id: true,
          status: true,
          riderId: true,
          rider: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });
}

export async function assignRiderToOrder(orderId: string, riderId: string, assignedById?: string) {
  const delivery = await prisma.delivery.upsert({
    where: {orderId},
    update: {
      riderId,
      assignedById,
      status: DeliveryStatus.ASSIGNED,
    },
    create: {
      orderId,
      riderId,
      assignedById,
      status: DeliveryStatus.ASSIGNED,
    },
    select: {
      id: true,
      orderId: true,
      status: true,
      order: {
        select: {
          orderNumber: true,
        },
      },
      rider: {
        select: {
          fullName: true,
        },
      },
    },
  });

  await notifyUsersWithPermission("orders.read", {
    type: "DELIVERY",
    title: `Rider assigned to ${delivery.order.orderNumber}`,
    body: `${delivery.rider?.fullName ?? "A rider"} has been assigned.`,
    metadata: {orderId: delivery.orderId, deliveryId: delivery.id},
  });

  return delivery;
}

export async function updateDeliveryStatus(deliveryId: string, status: DeliveryStatus, notes?: string) {
  const delivery = await prisma.delivery.update({
    where: {id: deliveryId},
    data: {
      status,
      notes: notes ?? undefined,
      dispatchedAt: status === DeliveryStatus.IN_TRANSIT ? new Date() : undefined,
      deliveredAt: status === DeliveryStatus.DELIVERED ? new Date() : undefined,
    },
    select: {
      id: true,
      status: true,
      orderId: true,
      order: {
        select: {
          orderNumber: true,
        },
      },
    },
  });

  await notifyUsersWithPermission("orders.read", {
    type: "DELIVERY",
    title: `Delivery updated for ${delivery.order.orderNumber}`,
    body: `Delivery status changed to ${delivery.status}.`,
    metadata: {deliveryId: delivery.id, orderId: delivery.orderId, status: delivery.status},
  });

  return delivery;
}
