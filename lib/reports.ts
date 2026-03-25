import {OrderStatus, ProductType} from "@prisma/client";
import {prisma} from "@/lib/prisma";

export type ReportRange = "daily" | "weekly" | "monthly" | "custom";

export type ReportSummary = {
  range: ReportRange;
  from: Date;
  to: Date;
  kpis: {
    orders: number;
    deliveredOrders: number;
    revenue: number;
    cost: number;
    profit: number;
    avgOrderValue: number;
  };
  productBreakdown: {
    wigsRevenue: number;
    perfumesRevenue: number;
    wigsQty: number;
    perfumesQty: number;
  };
  topProducts: Array<{
    name: string;
    qty: number;
    revenue: number;
  }>;
  lowStock: Array<{
    name: string;
    sku: string;
    quantityOnHand: number;
  }>;
  timeline: Array<{
    day: string;
    orders: number;
    revenue: number;
    profit: number;
  }>;
};

export function resolveRange(range: ReportRange, from?: string, to?: string) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (range === "custom" && from && to) {
    const customFrom = new Date(from);
    const customTo = new Date(to);
    customFrom.setHours(0, 0, 0, 0);
    customTo.setHours(23, 59, 59, 999);
    return {from: customFrom, to: customTo};
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "weekly") {
    start.setDate(start.getDate() - 6);
  } else if (range === "monthly") {
    start.setDate(start.getDate() - 29);
  }

  return {from: start, to: end};
}

export async function getReportSummary(range: ReportRange, from?: string, to?: string): Promise<ReportSummary> {
  const resolved = resolveRange(range, from, to);

  const [orders, topItems, lowStockProducts] = await Promise.all([
    prisma.order.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: resolved.from,
          lte: resolved.to,
        },
      },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            totalPrice: true,
            product: {
              select: {
                name: true,
                productType: true,
                costPrice: true,
              },
            },
          },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          deletedAt: null,
          createdAt: {
            gte: resolved.from,
            lte: resolved.to,
          },
          status: {
            not: OrderStatus.CANCELLED,
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [{isLowStock: true}, {stock: {is: {quantityOnHand: {lte: 5}}}}],
      },
      select: {
        name: true,
        sku: true,
        stock: {
          select: {
            quantityOnHand: true,
          },
        },
      },
      take: 10,
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const topProductsById = await prisma.product.findMany({
    where: {
      id: {
        in: topItems.map((item) => item.productId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const topNameMap = new Map(topProductsById.map((product) => [product.id, product.name]));

  let deliveredOrders = 0;
  let revenue = 0;
  let cost = 0;
  let wigsRevenue = 0;
  let perfumesRevenue = 0;
  let wigsQty = 0;
  let perfumesQty = 0;

  const timelineMap = new Map<string, {orders: number; revenue: number; profit: number}>();

  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const bucket = timelineMap.get(day) ?? {orders: 0, revenue: 0, profit: 0};
    bucket.orders += 1;

    if (order.status === OrderStatus.DELIVERED) {
      deliveredOrders += 1;
      const orderRevenue = Number(order.totalAmount);
      revenue += orderRevenue;
      bucket.revenue += orderRevenue;

      let orderCost = 0;
      for (const item of order.items) {
        const qty = item.quantity;
        const lineRevenue = Number(item.totalPrice);
        const unitCost = Number(item.product.costPrice ?? 0);
        const lineCost = unitCost * qty;
        orderCost += lineCost;

        if (item.product.productType === ProductType.WIG) {
          wigsRevenue += lineRevenue;
          wigsQty += qty;
        } else if (item.product.productType === ProductType.PERFUME) {
          perfumesRevenue += lineRevenue;
          perfumesQty += qty;
        }
      }

      cost += orderCost;
      bucket.profit += orderRevenue - orderCost;
    }

    timelineMap.set(day, bucket);
  }

  const profit = revenue - cost;

  const timeline = [...timelineMap.entries()]
    .map(([day, values]) => ({day, ...values}))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  return {
    range,
    from: resolved.from,
    to: resolved.to,
    kpis: {
      orders: orders.length,
      deliveredOrders,
      revenue,
      cost,
      profit,
      avgOrderValue: deliveredOrders > 0 ? revenue / deliveredOrders : 0,
    },
    productBreakdown: {
      wigsRevenue,
      perfumesRevenue,
      wigsQty,
      perfumesQty,
    },
    topProducts: topItems.map((item) => ({
      name: topNameMap.get(item.productId) ?? item.productId,
      qty: item._sum.quantity ?? 0,
      revenue: Number(item._sum.totalPrice ?? 0),
    })),
    lowStock: lowStockProducts.map((item) => ({
      name: item.name,
      sku: item.sku,
      quantityOnHand: item.stock?.quantityOnHand ?? 0,
    })),
    timeline,
  };
}

export async function saveReportSnapshot(summary: ReportSummary, userId?: string) {
  return prisma.reportSnapshot.create({
    data: {
      reportType: `dashboard:${summary.range}`,
      dateFrom: summary.from,
      dateTo: summary.to,
      payload: summary as unknown as object,
      generatedById: userId,
    },
    select: {
      id: true,
      reportType: true,
      createdAt: true,
    },
  });
}
