import {NextResponse} from "next/server";
import {ProductType, PriceMode} from "@prisma/client";
import {z} from "zod";
import {requirePermission} from "@/lib/guards";
import {createProduct, listAdminProducts} from "@/lib/admin-products";

const createProductSchema = z.object({
  name: z.string().trim().min(2).max(255),
  description: z.string().trim().max(2000).optional().nullable(),
  productType: z.enum(["WIG", "PERFUME"]),
  priceMode: z.enum(["FIXED", "NEGOTIABLE"]).default("FIXED"),
  salePrice: z.number().positive(),
  costPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z
    .string()
    .refine((value) => {
      if (!value) return true;
      if (value.startsWith("/")) return true;
      return z.string().url().safeParse(value).success;
    }, "Image URL must be an absolute URL or a local /uploads path")
    .optional()
    .nullable(),
  imageUrls: z
    .array(
      z.string().refine((value) => {
        if (!value) return false;
        if (value.startsWith("/")) return true;
        return z.string().url().safeParse(value).success;
      }, "Each image URL must be an absolute URL or a local /uploads path")
    )
    .optional(),
  imageAltText: z.string().max(255).optional().nullable(),
  quantityOnHand: z.number().int().nonnegative().default(0),
  currency: z.string().length(3).default("XAF"),
  isPublished: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const session = await requirePermission("products.read");
    if (!session) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("q") || undefined;
    const type = (url.searchParams.get("type") || undefined) as ProductType | undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const includeDeleted = url.searchParams.get("includeDeleted") === "true";

    const products = await listAdminProducts({
      search,
      type,
      categoryId,
      includeDeleted,
    });

    return NextResponse.json({data: products}, {status: 200});
  } catch (error) {
    console.error("Failed to list products:", error);
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission("products.write");
    if (!session) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const body = await request.json().catch(() => ({}));
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {error: "Invalid product data", details: parsed.error.flatten()},
        {status: 400}
      );
    }

    const product = await createProduct(
      {
        ...parsed.data,
        imageUrls:
          parsed.data.imageUrls && parsed.data.imageUrls.length > 0
            ? parsed.data.imageUrls
            : parsed.data.imageUrl
              ? [parsed.data.imageUrl]
              : undefined,
        productType: parsed.data.productType as ProductType,
        priceMode: parsed.data.priceMode as PriceMode,
        imageUrl: parsed.data.imageUrl ?? undefined,
        imageAltText: parsed.data.imageAltText ?? undefined,
        costPrice: parsed.data.costPrice ?? undefined,
        description: parsed.data.description ?? undefined,
      },
      session.user.id
    );

    return NextResponse.json({data: product}, {status: 201});
  } catch (error) {
    console.error("Failed to create product:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({error: error.message}, {status: 409});
    }

    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
