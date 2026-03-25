import {NextResponse} from "next/server";
import {createDeliveryZone, listDeliveryZones} from "@/lib/admin-delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  const zones = await listDeliveryZones();
  return NextResponse.json({zones});
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {zoneName?: string; city?: string; deliveryPrice?: number; isActive?: boolean}
    | null;

  if (!body?.zoneName?.trim() || !body.city?.trim() || typeof body.deliveryPrice !== "number") {
    return NextResponse.json({message: "Invalid zone payload"}, {status: 400});
  }

  const zone = await createDeliveryZone({
    zoneName: body.zoneName.trim(),
    city: body.city.trim(),
    deliveryPrice: body.deliveryPrice,
    isActive: body.isActive,
  });

  return NextResponse.json({zone}, {status: 201});
}
