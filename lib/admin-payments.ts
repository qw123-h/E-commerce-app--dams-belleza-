import {PaymentStatus} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {notifyUsersWithPermission} from "@/lib/notifications";

function generateReceiptNumber() {
  const now = new Date();
  const dateToken = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomToken = Math.floor(1000 + Math.random() * 9000);
  return `REC-${dateToken}-${randomToken}`;
}

export async function listRecentPayments(limit = 80) {
  return prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      method: true,
      status: true,
      amount: true,
      reference: true,
      rejectedReason: true,
      confirmedAt: true,
      createdAt: true,
      order: {
        select: {
          orderNumber: true,
          deliveryMethod: true,
          notes: true,
          receipts: {
            orderBy: {
              generatedAt: "desc",
            },
            take: 1,
            select: {
              receiptNumber: true,
            },
          },
        },
      },
      screenshots: {
        select: {
          url: true,
        },
        take: 1,
      },
    },
  });
}

export async function getPaymentMetrics() {
  const [totalPayments, pendingPayments, confirmedPayments, rejectedPayments] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({where: {status: PaymentStatus.PENDING}}),
    prisma.payment.count({where: {status: PaymentStatus.CONFIRMED}}),
    prisma.payment.count({where: {status: PaymentStatus.REJECTED}}),
  ]);

  return {
    totalPayments,
    pendingPayments,
    confirmedPayments,
    rejectedPayments,
  };
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus, rejectedReason?: string) {
  const updated = await prisma.payment.update({
    where: {id: paymentId},
    data: {
      status,
      rejectedReason: status === PaymentStatus.REJECTED ? rejectedReason || "Rejected by admin" : null,
      confirmedAt: status === PaymentStatus.CONFIRMED ? new Date() : null,
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      orderId: true,
    },
  });

  let receiptNumber: string | null = null;

  if (status === PaymentStatus.CONFIRMED) {
    const existing = await prisma.receipt.findFirst({
      where: {orderId: updated.orderId},
      select: {receiptNumber: true},
    });

    if (existing) {
      receiptNumber = existing.receiptNumber;
    } else {
      receiptNumber = generateReceiptNumber();
      await prisma.receipt.create({
        data: {
          orderId: updated.orderId,
          receiptNumber,
          fileUrl: `/api/documents/receipts/${receiptNumber}`,
        },
      });
    }
  }

  await notifyUsersWithPermission("payments.review", {
    type: "PAYMENT",
    title: `Payment ${updated.id} updated`,
    body: `Payment status changed to ${updated.status}.`,
    metadata: {
      paymentId: updated.id,
      status: updated.status,
      receiptNumber,
    },
  });

  return {
    ...updated,
    receiptNumber,
  };
}
