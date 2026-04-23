import {NextResponse} from "next/server";
import {updateDeliveryZone} from "@/lib/admin-delivery";
import {requirePermission} from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: {params: {zoneId: string}}) {
  const session = await requirePermission("orders.write");

  if (!session) {
    return NextResponse.json({message: "Forbidden"}, {status: 403});
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<{zoneName: string; city: string; deliveryPrice: number; isActive: boolean}>
    | null;

  if (!body) {
    return NextResponse.json({message: "Invalid payload"}, {status: 400});
  }

  try {
    const zone = await updateDeliveryZone(context.params.zoneId, body);
    return NextResponse.json({zone});
  } catch {
    return NextResponse.json({message: "Could not update zone"}, {status: 400});
  }
}
