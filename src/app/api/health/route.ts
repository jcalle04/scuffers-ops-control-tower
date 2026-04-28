import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

import {
  getDatasetDirectory,
  getLocalStoreDirectory,
  REQUIRED_DATA_FILES,
} from "@/lib/config/app-config";
import { getLocalStoreStatus } from "@/lib/storage/snapshot-store";

export async function GET() {
  const datasetDir = getDatasetDirectory();
  const fileChecks = await Promise.all(
    REQUIRED_DATA_FILES.map(async (fileName) => {
      const filePath = path.join(datasetDir, fileName);
      try {
        const stats = await fs.stat(filePath);
        return {
          fileName,
          ok: true,
          size: stats.size,
          updatedAt: stats.mtime.toISOString(),
        };
      } catch {
        return {
          fileName,
          ok: false,
          size: 0,
          updatedAt: null,
        };
      }
    }),
  );

  const storeStatus = await getLocalStoreStatus();

  return NextResponse.json({
    status: fileChecks.every((file) => file.ok) ? "ok" : "degraded",
    mode: "local_json_demo",
    datasetDir,
    localStoreDir: getLocalStoreDirectory(),
    files: fileChecks,
    persistence: storeStatus,
  });
}
