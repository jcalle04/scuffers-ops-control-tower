import { NextResponse } from "next/server";

import { getCurrentSnapshot } from "@/lib/ops/service";

export async function GET() {
  const snapshot = await getCurrentSnapshot();
  return NextResponse.json({
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.createdAt,
    items: snapshot.campaignRisks,
  });
}
