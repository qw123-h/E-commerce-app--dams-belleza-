import {NextResponse} from "next/server";
import {runHealthChecks} from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runHealthChecks();

  return NextResponse.json(result.payload, {status: result.httpStatus});
}
