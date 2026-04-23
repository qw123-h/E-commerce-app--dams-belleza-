import {NextResponse} from "next/server";
import {updateRider} from "@/lib/admin-delivery";
import {requirePermission} from "@/lib/guards";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: {params: {riderId: string}}) {
  const session = await requirePermission("orders.write");

  if (!session) {
    return NextResponse.json({message: "Forbidden"}, {status: 403});
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<{fullName: string; phone: string; isActive: boolean}>
    | null;

  if (!body) {
    return NextResponse.json({message: "Invalid payload"}, {status: 400});
  }

  try {
    const rider = await updateRider(context.params.riderId, body);
    return NextResponse.json({rider});
  } catch {
    return NextResponse.json({message: "Could not update rider"}, {status: 400});
  }
}
