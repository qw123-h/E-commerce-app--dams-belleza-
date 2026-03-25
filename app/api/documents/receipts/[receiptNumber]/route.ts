import {NextResponse} from "next/server";
import {renderReceiptPdf} from "@/lib/pdf-documents";
import {prisma} from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {sessionHasPermission} from "@/lib/rbac";
import {verifyDocumentToken} from "@/lib/document-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: {params: {receiptNumber: string}}) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const receiptNumber = context.params.receiptNumber;

  const session = await auth();
  const canAdminDownload = sessionHasPermission(session, "orders.read") || sessionHasPermission(session, "payments.review");
  const hasValidToken = verifyDocumentToken(token, "receipt", receiptNumber);

  if (!canAdminDownload && !hasValidToken) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const receipt = await prisma.receipt.findUnique({
    where: {receiptNumber},
    select: {
      receiptNumber: true,
      generatedAt: true,
      order: {
        select: {
          orderNumber: true,
          totalAmount: true,
          payments: {
            where: {
              status: "CONFIRMED",
            },
            orderBy: {
              confirmedAt: "desc",
            },
            take: 1,
            select: {
              method: true,
              reference: true,
              amount: true,
            },
          },
        },
      },
    },
  });

  if (!receipt) {
    return NextResponse.json({message: "Not found"}, {status: 404});
  }

  const payment = receipt.order.payments[0];

  const pdf = await renderReceiptPdf({
    locale: "fr",
    receiptNumber: receipt.receiptNumber,
    orderNumber: receipt.order.orderNumber,
    issuedAt: receipt.generatedAt,
    paymentMethod: payment?.method ?? "-",
    paymentReference: payment?.reference ?? null,
    amount: Number(payment?.amount ?? receipt.order.totalAmount),
    currency: "XAF",
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
