import { NextResponse } from "next/server";

import { getCurrentSnapshot } from "@/lib/ops/service";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const persist = url.searchParams.get("persist") !== "0";
  const snapshot = await getCurrentSnapshot({ forceRefresh: true, persist });

  return NextResponse.json({
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.createdAt,
    persistedAt: snapshot.persistence.persistedAt,
    summary: snapshot.summary,
    metrics: snapshot.metrics,
    topActions: snapshot.topActions,
  });
}
