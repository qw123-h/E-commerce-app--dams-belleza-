import {NextResponse} from "next/server";
import {getReportSummary, type ReportRange, saveReportSnapshot} from "@/lib/reports";
import {auth} from "@/lib/auth";

export const dynamic = "force-dynamic";

function getRange(value: string | null): ReportRange {
  if (value === "daily" || value === "weekly" || value === "monthly" || value === "custom") {
    return value;
  }

  return "monthly";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = getRange(url.searchParams.get("range"));
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const summary = await getReportSummary(range, from, to);

  return NextResponse.json({
    range: summary.range,
    from: summary.from,
    to: summary.to,
    kpis: summary.kpis,
    productBreakdown: summary.productBreakdown,
    topProducts: summary.topProducts,
    lowStock: summary.lowStock,
    timeline: summary.timeline,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {range?: string; from?: string; to?: string}
    | null;

  const range = getRange(body?.range ?? null);
  const summary = await getReportSummary(range, body?.from, body?.to);
  const session = await auth();

  const snapshot = await saveReportSnapshot(summary, session?.user?.id);

  return NextResponse.json({
    snapshotId: snapshot.id,
    createdAt: snapshot.createdAt,
    reportType: snapshot.reportType,
  });
}
