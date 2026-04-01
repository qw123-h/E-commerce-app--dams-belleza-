import {NextResponse} from "next/server";
import {runHealthChecks} from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runHealthChecks();

  return NextResponse.json(
    {
      service: result.payload.service,
      status: result.payload.status,
      checks: result.payload.checks,
      details: result.payload.details,
      timestamp: result.payload.timestamp,
    },
    {status: result.httpStatus}
  );
}
