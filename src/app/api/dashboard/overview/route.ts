import { NextResponse } from "next/server";

import { toDashboardOverview } from "@/lib/ops/exporters";
import { getCurrentSnapshot } from "@/lib/ops/service";

export async function GET() {
  const snapshot = await getCurrentSnapshot();
  return NextResponse.json(toDashboardOverview(snapshot));
}
