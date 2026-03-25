import {NextResponse} from "next/server";
import {requireActiveSession} from "@/lib/auth";
import {assignRiderToOrder} from "@/lib/admin-delivery";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireActiveSession();

  const body = (await request.json().catch(() => null)) as {orderId?: string; riderId?: string} | null;

  if (!body?.orderId || !body.riderId) {
    return NextResponse.json({message: "orderId and riderId are required"}, {status: 400});
  }

  try {
    const delivery = await assignRiderToOrder(body.orderId, body.riderId, session?.user?.id);
    return NextResponse.json({delivery});
  } catch {
    return NextResponse.json({message: "Could not assign rider"}, {status: 400});
  }
}
