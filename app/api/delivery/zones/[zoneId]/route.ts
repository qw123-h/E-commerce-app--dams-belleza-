import {NextResponse} from "next/server";
import {updateDeliveryZone} from "@/lib/admin-delivery";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: {params: {zoneId: string}}) {
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
