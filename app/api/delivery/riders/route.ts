import {NextResponse} from "next/server";
import {createRider, listRiders} from "@/lib/admin-delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  const riders = await listRiders();
  return NextResponse.json({riders});
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {fullName?: string; phone?: string} | null;

  if (!body?.fullName?.trim() || !body.phone?.trim()) {
    return NextResponse.json({message: "Invalid rider payload"}, {status: 400});
  }

  const rider = await createRider({
    fullName: body.fullName.trim(),
    phone: body.phone.trim(),
  });

  return NextResponse.json({rider}, {status: 201});
}
