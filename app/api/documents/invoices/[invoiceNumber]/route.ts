import {NextResponse} from "next/server";
import {renderInvoicePdf} from "@/lib/pdf-documents";
import {prisma} from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {sessionHasPermission} from "@/lib/rbac";
import {verifyDocumentToken} from "@/lib/document-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: {params: {invoiceNumber: string}}) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const invoiceNumber = context.params.invoiceNumber;

  const session = await auth();
  const canAdminDownload = sessionHasPermission(session, "orders.read") || sessionHasPermission(session, "payments.review");
  const hasValidToken = verifyDocumentToken(token, "invoice", invoiceNumber);

  if (!canAdminDownload && !hasValidToken) {
    return NextResponse.json({message: "Unauthorized"}, {status: 401});
  }

  const invoice = await prisma.invoice.findUnique({
    where: {invoiceNumber},
    select: {
      invoiceNumber: true,
      generatedAt: true,
      order: {
        select: {
          orderNumber: true,
          deliveryMethod: true,
          subtotalAmount: true,
          deliveryAmount: true,
          totalAmount: true,
          notes: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
            select: {
              method: true,
              reference: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({message: "Not found"}, {status: 404});
  }

  const customer = invoice.order.notes?.split("|")[0]?.replace(/^Guest:\s*/i, "").trim() || "Guest";
  const firstPayment = invoice.order.payments[0];

  const pdf = await renderInvoicePdf({
    locale: "fr",
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: invoice.order.orderNumber,
    issuedAt: invoice.generatedAt,
    customer,
    paymentMethod: firstPayment?.method ?? "-",
    paymentReference: firstPayment?.reference ?? null,
    deliveryMethod: invoice.order.deliveryMethod,
    subtotal: Number(invoice.order.subtotalAmount),
    deliveryFee: Number(invoice.order.deliveryAmount),
    total: Number(invoice.order.totalAmount),
    currency: "XAF",
    items: invoice.order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
