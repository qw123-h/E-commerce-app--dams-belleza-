import {NextResponse} from "next/server";
import * as XLSX from "xlsx";
import {buildReportPdf, buildReportWorkbook} from "@/lib/report-export";
import {getReportSummary, type ReportRange} from "@/lib/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRange(value: string | null): ReportRange {
  if (value === "daily" || value === "weekly" || value === "monthly" || value === "custom") {
    return value;
  }

  return "monthly";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";
  const range = getRange(url.searchParams.get("range"));
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const summary = await getReportSummary(range, from, to);

  if (format === "pdf") {
    const buffer = await buildReportPdf(summary);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${range}.pdf"`,
      },
    });
  }

  const workbook = buildReportWorkbook(summary);
  const buffer = XLSX.write(workbook, {bookType: "xlsx", type: "buffer"}) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="report-${range}.xlsx"`,
    },
  });
}
