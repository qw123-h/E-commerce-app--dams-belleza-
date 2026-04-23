import {NextResponse} from "next/server";
import {createDeliveryZone, listDeliveryZones} from "@/lib/admin-delivery";
import {requirePermission} from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requirePermission("orders.read");

  if (!session) {
    return NextResponse.json({message: "Forbidden"}, {status: 403});
  }

  const zones = await listDeliveryZones();
  return NextResponse.json({zones});
}

export async function POST(request: Request) {
  const session = await requirePermission("orders.write");

  if (!session) {
    return NextResponse.json({message: "Forbidden"}, {status: 403});
  }

  const body = (await request.json().catch(() => null)) as
    | {zoneName?: string; city?: string; deliveryPrice?: number; isActive?: boolean}
    | null;

  if (!body?.zoneName?.trim() || !body.city?.trim() || typeof body.deliveryPrice !== "number") {
    return NextResponse.json({message: "Invalid zone payload"}, {status: 400});
  }

  try {
    const zone = await createDeliveryZone({
      zoneName: body.zoneName.trim(),
      city: body.city.trim(),
      deliveryPrice: body.deliveryPrice,
      isActive: body.isActive,
    });

    return NextResponse.json({zone}, {status: 201});
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({message: "Zone already exists for this city"}, {status: 409});
    }
    return NextResponse.json({message: "Could not create zone"}, {status: 400});
  }
}
