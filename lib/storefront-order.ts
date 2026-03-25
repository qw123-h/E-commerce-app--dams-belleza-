import {DeliveryMethod, NotificationType, PaymentMethod, Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {notifyUsersWithPermission} from "@/lib/notifications";

type GuestOrderInput = {
  productId: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: DeliveryMethod;
  deliveryZoneId?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
};

function generateOrderNumber() {
  const now = new Date();
  const dateToken = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomToken = Math.floor(1000 + Math.random() * 9000);
  return `DB-${dateToken}-${randomToken}`;
}

function generateInvoiceNumber() {
  const now = new Date();
  const dateToken = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomToken = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateToken}-${randomToken}`;
}

export async function getActiveDeliveryZones() {
  return prisma.deliveryZone.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: [{city: "asc"}, {zoneName: "asc"}],
    select: {
      id: true,
      city: true,
      zoneName: true,
      deliveryPrice: true,
    },
  });
}

export async function createGuestOrder(input: GuestOrderInput) {
  const product = await prisma.product.findFirst({
    where: {
      id: input.productId,
      isPublished: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      salePrice: true,
      priceMode: true,
      currency: true,
      stock: {
        select: {
          quantityOnHand: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not available");
  }

  if (!product.salePrice) {
    throw new Error("Selected product is negotiable only");
  }

  if (input.quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const quantityOnHand = product.stock?.quantityOnHand ?? 0;
  if (quantityOnHand < input.quantity) {
    throw new Error("Insufficient stock");
  }

  const deliveryZone =
    input.deliveryMethod === DeliveryMethod.DELIVERY && input.deliveryZoneId
      ? await prisma.deliveryZone.findFirst({
          where: {
            id: input.deliveryZoneId,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            deliveryPrice: true,
          },
        })
      : null;

  if (input.deliveryMethod === DeliveryMethod.DELIVERY && !deliveryZone) {
    throw new Error("Delivery zone is required for delivery");
  }

  const unitPrice = new Prisma.Decimal(product.salePrice);
  const subtotalAmount = unitPrice.mul(input.quantity);
  const deliveryAmount = deliveryZone?.deliveryPrice ?? new Prisma.Decimal(0);
  const totalAmount = subtotalAmount.add(deliveryAmount);

  const invoiceNumber = generateInvoiceNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      deliveryMethod: input.deliveryMethod,
      deliveryZoneId: deliveryZone?.id,
      subtotalAmount,
      deliveryAmount,
      totalAmount,
      notes: [
        `Guest: ${input.customerName}`,
        `Phone: ${input.customerPhone}`,
        input.customerEmail ? `Email: ${input.customerEmail}` : null,
        input.notes ? `Notes: ${input.notes}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
      items: {
        create: {
          productId: product.id,
          quantity: input.quantity,
          unitPrice,
          totalPrice: subtotalAmount,
        },
      },
      payments: {
        create: {
          method: input.paymentMethod,
          amount: totalAmount,
          reference: input.paymentReference,
        },
      },
      invoices: {
        create: {
          invoiceNumber,
          fileUrl: `/api/documents/invoices/${invoiceNumber}`,
        },
      },
    },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      invoices: {
        select: {
          invoiceNumber: true,
          fileUrl: true,
        },
        take: 1,
      },
    },
  });

  await prisma.stock.update({
    where: {
      productId: product.id,
    },
    data: {
      quantityOnHand: {
        decrement: input.quantity,
      },
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: product.id,
      movementType: "SALE",
      quantityChange: -input.quantity,
      reason: `Guest checkout order ${order.orderNumber}`,
    },
  });

  await Promise.all([
    notifyUsersWithPermission("orders.read", {
      type: NotificationType.ORDER,
      title: `New order ${order.orderNumber}`,
      body: `A new guest order was placed for ${input.customerName}.`,
      metadata: {
        orderNumber: order.orderNumber,
      },
    }),
    notifyUsersWithPermission("payments.review", {
      type: NotificationType.PAYMENT,
      title: `Payment pending for ${order.orderNumber}`,
      body: `A ${input.paymentMethod} payment is awaiting review.`,
      metadata: {
        orderNumber: order.orderNumber,
        paymentMethod: input.paymentMethod,
      },
    }),
  ]);

  return {
    ...order,
    currency: product.currency,
    invoiceNumber: order.invoices[0]?.invoiceNumber,
    invoiceUrl: order.invoices[0]?.fileUrl,
  };
}
