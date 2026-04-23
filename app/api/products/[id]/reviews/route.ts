import {NextResponse} from "next/server";
import {z} from "zod";
import {auth} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: {params: {id: string}}) {
  const reviews = await prisma.review.findMany({
    where: {
      productId: context.params.id,
      isApproved: true,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return NextResponse.json({reviews});
}

export async function POST(request: Request, context: {params: {id: string}}) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const parsed = createReviewSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({message: "Invalid review payload"}, {status: 400});
  }

  const product = await prisma.product.findFirst({
    where: {
      id: context.params.id,
      isPublished: true,
      deletedAt: null,
    },
    select: {id: true},
  });

  if (!product) {
    return NextResponse.json({message: "Product not found"}, {status: 404});
  }

  const review = await prisma.review.create({
    data: {
      productId: product.id,
      customerId: session.user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      isApproved: false,
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      isApproved: true,
      createdAt: true,
    },
  });

  return NextResponse.json({review}, {status: 201});
}
