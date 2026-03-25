import "dotenv/config";
import {
  DeliveryMethod,
  DeliveryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PriceMode,
  PrismaClient,
  ProductType,
  RoleScope,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "ChangeMe123!";

const PERMISSION_KEYS = [
  ["products.read", "Products", "Read products"],
  ["products.write", "Products", "Create and edit products"],
  ["orders.read", "Orders", "Read orders"],
  ["orders.write", "Orders", "Update order status"],
  ["payments.review", "Payments", "Confirm or reject payments"],
  ["reports.read", "Reports", "Read reports"],
  ["roles.manage", "Roles", "Manage dynamic roles and permissions"],
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function imagePlaceholder(type: "perfume" | "wig", slug: string) {
  return `https://res.cloudinary.com/demo/image/upload/dams-belleza/${type}/${slug}.jpg`;
}

function orderDateOffset(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const superAdminRole = await prisma.role.upsert({
    where: {slug: "super-admin"},
    update: {},
    create: {
      name: "Super Admin",
      slug: "super-admin",
      description: "Full system control",
      scope: RoleScope.SYSTEM,
    },
  });

  const ownerRole = await prisma.role.upsert({
    where: {slug: "store-owner"},
    update: {},
    create: {
      name: "Store Owner",
      slug: "store-owner",
      description: "Operational owner access",
      scope: RoleScope.SYSTEM,
    },
  });

  const helperRole = await prisma.role.upsert({
    where: {slug: "helper"},
    update: {},
    create: {
      name: "Helper",
      slug: "helper",
      description: "Delegated helper role",
      scope: RoleScope.SYSTEM,
    },
  });

  const customRole = await prisma.role.upsert({
    where: {slug: "assistant-manager"},
    update: {},
    create: {
      name: "Assistant Manager",
      slug: "assistant-manager",
      description: "Custom role created by Super Admin",
      scope: RoleScope.CUSTOM,
    },
  });

  for (const [key, module, label] of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: {key},
      update: {},
      create: {key, module, label},
    });
  }

  const allPermissions = await prisma.permission.findMany({select: {id: true}});

  await prisma.rolePermission.deleteMany({where: {roleId: superAdminRole.id}});
  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: superAdminRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  const ownerPermissions = await prisma.permission.findMany({
    where: {key: {in: ["products.read", "products.write", "orders.read", "orders.write", "payments.review", "reports.read"]}},
    select: {id: true},
  });

  await prisma.rolePermission.deleteMany({where: {roleId: ownerRole.id}});
  await prisma.rolePermission.createMany({
    data: ownerPermissions.map((permission) => ({
      roleId: ownerRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  const helperPermissions = await prisma.permission.findMany({
    where: {key: {in: ["orders.read", "orders.write", "payments.review"]}},
    select: {id: true},
  });

  await prisma.rolePermission.deleteMany({where: {roleId: helperRole.id}});
  await prisma.rolePermission.createMany({
    data: helperPermissions.map((permission) => ({
      roleId: helperRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  const admin = await prisma.user.upsert({
    where: {email: "admin@damsbelleza.com"},
    update: {},
    create: {
      email: "admin@damsbelleza.com",
      firstName: "System",
      lastName: "Admin",
      phone: "+237691000001",
      whatsappNumber: "+237691949858",
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const owner = await prisma.user.upsert({
    where: {email: "owner@damsbelleza.com"},
    update: {},
    create: {
      email: "owner@damsbelleza.com",
      firstName: "Dam",
      lastName: "Belleza",
      phone: "+237691000002",
      whatsappNumber: "+237691949858",
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const customers = [
    {
      email: "customer.a@damsbelleza.com",
      firstName: "Aline",
      lastName: "Nkou",
      phone: "+237691200001",
    },
    {
      email: "customer.b@damsbelleza.com",
      firstName: "Brigitte",
      lastName: "Essomba",
      phone: "+237691200002",
    },
    {
      email: "customer.c@damsbelleza.com",
      firstName: "Carine",
      lastName: "Manga",
      phone: "+237691200003",
    },
  ];

  for (const customer of customers) {
    await prisma.user.upsert({
      where: {email: customer.email},
      update: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        whatsappNumber: customer.phone,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        whatsappNumber: customer.phone,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
  }

  const helpers = [
    {
      email: "helper.one@damsbelleza.com",
      firstName: "Mireille",
      lastName: "Nana",
      phone: "+237691000003",
    },
    {
      email: "helper.two@damsbelleza.com",
      firstName: "Estelle",
      lastName: "Mbo",
      phone: "+237691000004",
    },
  ];

  for (const helper of helpers) {
    await prisma.user.upsert({
      where: {email: helper.email},
      update: {},
      create: {
        ...helper,
        whatsappNumber: helper.phone,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
  }

  await prisma.userRole.upsert({
    where: {userId_roleId: {userId: admin.id, roleId: superAdminRole.id}},
    update: {},
    create: {userId: admin.id, roleId: superAdminRole.id},
  });

  await prisma.userRole.upsert({
    where: {userId_roleId: {userId: owner.id, roleId: ownerRole.id}},
    update: {},
    create: {userId: owner.id, roleId: ownerRole.id},
  });

  const helperUsers = await prisma.user.findMany({
    where: {email: {in: helpers.map((helper) => helper.email)}},
    select: {id: true},
  });

  for (const helperUser of helperUsers) {
    await prisma.userRole.upsert({
      where: {userId_roleId: {userId: helperUser.id, roleId: helperRole.id}},
      update: {},
      create: {userId: helperUser.id, roleId: helperRole.id},
    });
  }

  await prisma.userRole.upsert({
    where: {userId_roleId: {userId: owner.id, roleId: customRole.id}},
    update: {},
    create: {userId: owner.id, roleId: customRole.id},
  });

  const categories = [
    {name: "Perfumes", slug: "perfumes", description: "Premium fragrances"},
    {name: "Wigs", slug: "wigs", description: "Luxury wigs and hair pieces"},
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {slug: category.slug},
      update: {},
      create: category,
    });
  }

  const perfumeCategory = await prisma.category.findUniqueOrThrow({where: {slug: "perfumes"}});
  const wigCategory = await prisma.category.findUniqueOrThrow({where: {slug: "wigs"}});

  const perfumeCatalog = [
    ["Velvet Orchid", 18000, 12000],
    ["Noir Ambre", 22500, 14500],
    ["Soleil Vanille", 19500, 12800],
    ["Rose Signature", 21000, 14000],
    ["Golden Oud", 24500, 16500],
    ["Coco Satin", 19800, 13000],
    ["Mokolo Bloom", 17500, 11200],
    ["Pearl Musk", 18900, 12200],
    ["Royal Citrus", 20500, 13600],
    ["Midnight Plum", 23800, 16000],
    ["Iris Elixir", 22900, 15100],
    ["Pure Magnolia", 19200, 12600],
    ["Sahara Spice", 25200, 17000],
    ["Nude Patchouli", 21800, 14400],
    ["Cedar Silk", 20800, 13700],
    ["White Neroli", 21400, 14200],
    ["Ruby Jasmine", 23600, 15800],
  ] as const;

  const wigCatalog = [
    ["Silk Body Wave", 45000],
    ["Lace Frontal Bob", 52000],
    ["HD Closure Straight", 61000],
    ["Raw Deep Wave 20", 72000],
    ["Bone Straight Luxe", 84000],
    ["Kinky Curly Crown", 56000],
    ["Water Wave Soft", 59000],
    ["Burgundy Body Wave", 64000],
    ["Honey Blonde Bob", 68000],
    ["Natural Pixie Unit", 43000],
    ["Boho Curl Frontal", 71000],
    ["Sleek Yaki Straight", 60000],
    ["Afro Curl Premium", 57500],
    ["Layered Bob 12", 50000],
    ["Front Lace Curly 18", 69500],
    ["Transparent Lace 24", 88000],
    ["Soft Loose Wave", 62000],
    ["Knotless Inspired Unit", 65500],
    ["Glueless Everyday Bob", 54000],
    ["Luxury Frontal 28", 93000],
  ] as const;

  const seededProducts: Array<{id: string; sku: string; slug: string; productType: ProductType}> = [];

  for (let index = 0; index < perfumeCatalog.length; index += 1) {
    const [name, salePrice, costPrice] = perfumeCatalog[index];
    const sku = `PERF-${String(index + 1).padStart(3, "0")}`;
    const slug = slugify(name);

    const product = await prisma.product.upsert({
      where: {sku},
      update: {
        name,
        slug,
        description: `${name} - premium perfume curated by Dam's belleza.`,
        productType: ProductType.PERFUME,
        priceMode: PriceMode.FIXED,
        salePrice,
        costPrice,
        categoryId: perfumeCategory.id,
        isPublished: true,
        updatedById: admin.id,
      },
      create: {
        sku,
        name,
        slug,
        description: `${name} - premium perfume curated by Dam's belleza.`,
        productType: ProductType.PERFUME,
        priceMode: PriceMode.FIXED,
        salePrice,
        costPrice,
        categoryId: perfumeCategory.id,
        currency: "XAF",
        isPublished: true,
        createdById: admin.id,
        updatedById: admin.id,
      },
      select: {id: true, sku: true, slug: true, productType: true},
    });

    seededProducts.push(product);
  }

  for (let index = 0; index < wigCatalog.length; index += 1) {
    const [name, costPrice] = wigCatalog[index];
    const sku = `WIG-${String(index + 1).padStart(3, "0")}`;
    const slug = slugify(name);

    const product = await prisma.product.upsert({
      where: {sku},
      update: {
        name,
        slug,
        description: `${name} - premium custom wig consultation available on WhatsApp.`,
        productType: ProductType.WIG,
        priceMode: PriceMode.NEGOTIABLE,
        salePrice: null,
        costPrice,
        categoryId: wigCategory.id,
        isPublished: true,
        updatedById: admin.id,
      },
      create: {
        sku,
        name,
        slug,
        description: `${name} - premium custom wig consultation available on WhatsApp.`,
        productType: ProductType.WIG,
        priceMode: PriceMode.NEGOTIABLE,
        salePrice: null,
        costPrice,
        categoryId: wigCategory.id,
        currency: "XAF",
        isPublished: true,
        createdById: admin.id,
        updatedById: admin.id,
      },
      select: {id: true, sku: true, slug: true, productType: true},
    });

    seededProducts.push(product);
  }

  for (const product of seededProducts) {
    await prisma.productImage.deleteMany({where: {productId: product.id}});
    await prisma.productImage.create({
      data: {
        productId: product.id,
        cloudinaryPublicId: `dams-belleza/${product.productType === ProductType.PERFUME ? "perfume" : "wig"}/${product.slug}`,
        url: imagePlaceholder(product.productType === ProductType.PERFUME ? "perfume" : "wig", product.slug),
        altText: product.slug.replace(/-/g, " "),
        isPrimary: true,
        sortOrder: 0,
      },
    });

    await prisma.stock.upsert({
      where: {productId: product.id},
      update: {
        quantityOnHand: product.sku.startsWith("PERF") ? 20 + (Number(product.sku.slice(-2)) % 9) : 4 + (Number(product.sku.slice(-2)) % 6),
        reorderLevel: product.sku.startsWith("PERF") ? 6 : 3,
      },
      create: {
        productId: product.id,
        quantityOnHand: product.sku.startsWith("PERF") ? 20 + (Number(product.sku.slice(-2)) % 9) : 4 + (Number(product.sku.slice(-2)) % 6),
        reorderLevel: product.sku.startsWith("PERF") ? 6 : 3,
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        movementType: "PURCHASE",
        quantityChange: product.sku.startsWith("PERF") ? 20 : 8,
        reason: "Phase 13 demo stock load",
        createdById: admin.id,
      },
    });
  }

  await prisma.deliveryZone.upsert({
    where: {zoneName_city: {zoneName: "Mokolo Centre", city: "Yaounde"}},
    update: {},
    create: {
      zoneName: "Mokolo Centre",
      city: "Yaounde",
      deliveryPrice: "1000.00",
    },
  });

  await prisma.deliveryZone.upsert({
    where: {zoneName_city: {zoneName: "Bastos", city: "Yaounde"}},
    update: {},
    create: {
      zoneName: "Bastos",
      city: "Yaounde",
      deliveryPrice: "2500.00",
    },
  });

  await prisma.deliveryZone.upsert({
    where: {zoneName_city: {zoneName: "Odza Carrefour", city: "Yaounde"}},
    update: {},
    create: {
      zoneName: "Odza Carrefour",
      city: "Yaounde",
      deliveryPrice: "3000.00",
    },
  });

  await prisma.deliveryZone.upsert({
    where: {zoneName_city: {zoneName: "Bonamoussadi", city: "Douala"}},
    update: {},
    create: {
      zoneName: "Bonamoussadi",
      city: "Douala",
      deliveryPrice: "5000.00",
    },
  });

  await prisma.rider.upsert({
    where: {phone: "+237691000010"},
    update: {},
    create: {fullName: "Joel Delivery", phone: "+237691000010"},
  });

  await prisma.rider.upsert({
    where: {phone: "+237691000011"},
    update: {},
    create: {fullName: "Prince Moto", phone: "+237691000011"},
  });

  await prisma.rider.upsert({
    where: {phone: "+237691000012"},
    update: {},
    create: {fullName: "Fatou Express", phone: "+237691000012"},
  });

  const allProducts = await prisma.product.findMany({
    where: {deletedAt: null},
    select: {
      id: true,
      sku: true,
      salePrice: true,
      slug: true,
      name: true,
      productType: true,
      costPrice: true,
    },
    orderBy: {sku: "asc"},
  });

  const fixedPriceProducts = allProducts.filter((product) => product.salePrice !== null);
  const allZones = await prisma.deliveryZone.findMany({where: {isActive: true, deletedAt: null}, orderBy: {zoneName: "asc"}});
  const allRiders = await prisma.rider.findMany({where: {isActive: true}, orderBy: {fullName: "asc"}});
  const customerUsers = await prisma.user.findMany({
    where: {email: {in: customers.map((customer) => customer.email)}},
    select: {id: true, firstName: true, lastName: true, phone: true},
    orderBy: {email: "asc"},
  });

  const sampleOrders = [
    {orderNumber: "DB-20260325-1001", customerIndex: 0, productIndexes: [0, 2], status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.CONFIRMED, daysAgo: 2},
    {orderNumber: "DB-20260325-1002", customerIndex: 1, productIndexes: [3], status: OrderStatus.DISPATCHED, paymentStatus: PaymentStatus.CONFIRMED, daysAgo: 1},
    {orderNumber: "DB-20260325-1003", customerIndex: 2, productIndexes: [4, 5], status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PENDING, daysAgo: 0},
    {orderNumber: "DB-20260325-1004", customerIndex: 0, productIndexes: [6], status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.REJECTED, daysAgo: 5},
    {orderNumber: "DB-20260325-1005", customerIndex: 1, productIndexes: [7, 8], status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.CONFIRMED, daysAgo: 7},
    {orderNumber: "DB-20260325-1006", customerIndex: 2, productIndexes: [9], status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING, daysAgo: 0},
  ] as const;

  for (let index = 0; index < sampleOrders.length; index += 1) {
    const sample = sampleOrders[index];
    const existing = await prisma.order.findUnique({where: {orderNumber: sample.orderNumber}, select: {id: true}});

    if (existing) {
      continue;
    }

    const customer = customerUsers[sample.customerIndex % customerUsers.length];
    const zone = allZones[index % allZones.length];
    const deliveryMethod = index % 2 === 0 ? DeliveryMethod.DELIVERY : DeliveryMethod.PICKUP;
    const orderedProducts = sample.productIndexes
      .map((productIndex) => fixedPriceProducts[productIndex % fixedPriceProducts.length])
      .filter(Boolean);

    let subtotal = 0;
    const itemCreates = orderedProducts.map((product, productIndex) => {
      const quantity = 1 + ((index + productIndex) % 2);
      const unitPrice = Number(product.salePrice ?? 0);
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      return {
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    const deliveryAmount = deliveryMethod === DeliveryMethod.DELIVERY ? Number(zone.deliveryPrice) : 0;
    const totalAmount = subtotal + deliveryAmount;
    const createdAt = orderDateOffset(sample.daysAgo);

    const order = await prisma.order.create({
      data: {
        orderNumber: sample.orderNumber,
        customerId: customer.id,
        deliveryZoneId: deliveryMethod === DeliveryMethod.DELIVERY ? zone.id : null,
        status: sample.status,
        deliveryMethod,
        subtotalAmount: subtotal,
        deliveryAmount,
        totalAmount,
        notes: `Guest: ${customer.firstName} ${customer.lastName} | Phone: ${customer.phone}`,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: itemCreates,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
      },
    });

    const paymentMethod =
      index % 3 === 0
        ? PaymentMethod.ORANGE_MONEY
        : index % 3 === 1
          ? PaymentMethod.MTN_MOMO
          : PaymentMethod.BANK_TRANSFER;

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: paymentMethod,
        status: sample.paymentStatus,
        amount: totalAmount,
        reference: `PAY-REF-${1000 + index}`,
        rejectedReason: sample.paymentStatus === PaymentStatus.REJECTED ? "Invalid transfer proof" : null,
        confirmedById: sample.paymentStatus === PaymentStatus.CONFIRMED ? owner.id : null,
        confirmedAt: sample.paymentStatus === PaymentStatus.CONFIRMED ? createdAt : null,
        createdAt,
      },
      select: {id: true},
    });

    if (sample.paymentStatus === PaymentStatus.CONFIRMED) {
      await prisma.paymentScreenshot.create({
        data: {
          paymentId: payment.id,
          cloudinaryPublicId: `dams-belleza/payments/${sample.orderNumber.toLowerCase()}`,
          url: `https://res.cloudinary.com/demo/image/upload/dams-belleza/payments/${sample.orderNumber.toLowerCase()}.jpg`,
          uploadedAt: createdAt,
        },
      });
    }

    await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: `INV-${sample.orderNumber.split("-").slice(1).join("-")}`,
        fileUrl: `/api/documents/invoices/INV-${sample.orderNumber.split("-").slice(1).join("-")}`,
        generatedAt: createdAt,
      },
    });

    if (sample.paymentStatus === PaymentStatus.CONFIRMED) {
      await prisma.receipt.create({
        data: {
          orderId: order.id,
          receiptNumber: `REC-${sample.orderNumber.split("-").slice(1).join("-")}`,
          fileUrl: `/api/documents/receipts/REC-${sample.orderNumber.split("-").slice(1).join("-")}`,
          generatedAt: createdAt,
        },
      });
    }

    if (sample.status === OrderStatus.CONFIRMED || sample.status === OrderStatus.DISPATCHED || sample.status === OrderStatus.DELIVERED) {
      await prisma.delivery.create({
        data: {
          orderId: order.id,
          riderId: allRiders[index % allRiders.length]?.id,
          assignedById: owner.id,
          status:
            sample.status === OrderStatus.DELIVERED
              ? DeliveryStatus.DELIVERED
              : sample.status === OrderStatus.DISPATCHED
                ? DeliveryStatus.IN_TRANSIT
                : DeliveryStatus.ASSIGNED,
          dispatchedAt: sample.status === OrderStatus.DISPATCHED || sample.status === OrderStatus.DELIVERED ? createdAt : null,
          deliveredAt: sample.status === OrderStatus.DELIVERED ? new Date(createdAt.getTime() + 1000 * 60 * 60 * 6) : null,
        },
      });
    }
  }

  await prisma.review.deleteMany({where: {comment: {contains: "[seed]"}}});

  const reviewTargets = allProducts.slice(0, 8);
  for (let index = 0; index < reviewTargets.length; index += 1) {
    const target = reviewTargets[index];
    const customer = customerUsers[index % customerUsers.length];

    await prisma.review.create({
      data: {
        productId: target.id,
        customerId: customer.id,
        rating: 4 + (index % 2),
        comment: `[seed] Excellent quality for ${target.name}.`,
        isApproved: true,
      },
    });
  }

  const reportFrom = orderDateOffset(30);
  const reportTo = new Date();
  reportTo.setHours(23, 59, 59, 999);

  await prisma.reportSnapshot.create({
    data: {
      reportType: "dashboard:monthly",
      dateFrom: reportFrom,
      dateTo: reportTo,
      generatedById: owner.id,
      payload: {
        note: "Phase 13 seed snapshot",
        generatedAt: new Date().toISOString(),
      },
    },
  });

  console.log("Seed completed successfully with 17 perfumes, 20 wigs, users, roles, orders, payments, delivery data, and reviews.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
