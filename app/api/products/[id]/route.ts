import {NextResponse} from "next/server";
import {ProductType, PriceMode} from "@prisma/client";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {requirePermission} from "@/lib/guards";
import {updateProduct, deleteProduct, getProductById} from "@/lib/admin-products";

const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  productType: z.enum(["WIG", "PERFUME"]).optional(),
  priceMode: z.enum(["FIXED", "NEGOTIABLE"]).optional(),
  salePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().uuid().optional(),
  quantityOnHand: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const session = await requirePermission("products.read");
    if (!session) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({error: "Product not found"}, {status: 404});
    }

    return NextResponse.json({data: product}, {status: 200});
  } catch (error) {
    console.error("Failed to get product:", error);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function PATCH(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const session = await requirePermission("products.write");
    if (!session) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {error: "Invalid product data", details: parsed.error.flatten()},
        {status: 400}
      );
    }

    const updated = await updateProduct(params.id, parsed.data, session.user.id);

    return NextResponse.json({data: updated}, {status: 200});
  } catch (error) {
    console.error("Failed to update product:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({error: error.message}, {status: 404});
    }

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({error: error.message}, {status: 409});
    }

    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function DELETE(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const session = await requirePermission("products.write");
    if (!session) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    // Verify product exists
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({error: "Product not found"}, {status: 404});
    }

    const deleted = await deleteProduct(params.id);

    return NextResponse.json({data: deleted}, {status: 200});
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
