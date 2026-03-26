import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Find all products with no images
    const emptyProducts = await prisma.product.findMany({
      where: {
        images: { none: {} },
      },
      select: {
        id: true,
        sku: true,
        name: true,
      },
    });

    console.log(`Found ${emptyProducts.length} products with no images:`);
    emptyProducts.forEach((p) => console.log(`  - ${p.sku}: ${p.name}`));

    if (emptyProducts.length === 0) {
      console.log("\n✅ No empty products to delete!");
      process.exit(0);
    }

    const productIds = emptyProducts.map((p) => p.id);

    // Delete in proper order to respect foreign keys
    console.log("\nDeleting related data...");

    await prisma.orderItem.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("✓ Deleted order items");

    await prisma.review.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("✓ Deleted reviews");

    await prisma.stockMovement.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("✓ Deleted stock movements");

    await prisma.stock.deleteMany({
      where: { productId: { in: productIds } },
    });
    console.log("✓ Deleted stock records");

    await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });
    console.log("✓ Deleted products");

    const remaining = await prisma.product.count({
      where: { isPublished: true },
    });
    console.log(`\n✅ Cleanup complete! Remaining published products: ${remaining}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
