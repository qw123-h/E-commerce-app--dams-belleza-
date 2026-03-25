import {DeliveryStatus} from "@prisma/client";
import {NextResponse} from "next/server";
import {updateDeliveryStatus} from "@/lib/admin-delivery";

const ALLOWED = new Set<string>([
  DeliveryStatus.PENDING,
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.DELIVERED,
  DeliveryStatus.FAILED,
]);

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: {params: {deliveryId: string}}) {
  const body = (await request.json().catch(() => null)) as {status?: string; notes?: string} | null;

  if (!body?.status || !ALLOWED.has(body.status)) {
    return NextResponse.json({message: "Invalid delivery status"}, {status: 400});
  }

  try {
    const delivery = await updateDeliveryStatus(
      context.params.deliveryId,
      body.status as DeliveryStatus,
      body.notes?.trim() || undefined
    );
    return NextResponse.json({delivery});
  } catch {
    return NextResponse.json({message: "Could not update delivery status"}, {status: 400});
  }
}
