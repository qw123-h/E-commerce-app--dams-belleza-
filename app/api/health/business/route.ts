import {NextResponse} from "next/server";
import {runBusinessFlowChecks} from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runBusinessFlowChecks();
    return NextResponse.json(result.payload, {status: result.httpStatus});
  } catch (error) {
    return NextResponse.json(
      {
        service: "dams-belleza",
        status: "degraded",
        flow: "checkout-to-delivery",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unexpected health business check error",
      },
      {status: 503}
    );
  }
}
