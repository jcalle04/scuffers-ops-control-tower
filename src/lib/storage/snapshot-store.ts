import { promises as fs } from "node:fs";
import path from "node:path";

import { getLocalStoreDirectory } from "@/lib/config/app-config";
import type { ComputedSnapshot, PersistSnapshotResult } from "@/types/domain";

const LATEST_SNAPSHOT_FILE = "latest-snapshot.json";
const SNAPSHOT_HISTORY_DIR = "snapshots";

async function ensureStoreDirectories() {
  const storeDir = getLocalStoreDirectory();
  const historyDir = path.join(storeDir, SNAPSHOT_HISTORY_DIR);

  await fs.mkdir(historyDir, { recursive: true });

  return {
    storeDir,
    historyDir,
    latestSnapshotPath: path.join(storeDir, LATEST_SNAPSHOT_FILE),
  };
}

export async function persistSnapshot(
  snapshot: ComputedSnapshot,
): Promise<PersistSnapshotResult> {
  const { historyDir, latestSnapshotPath } = await ensureStoreDirectories();
  const persistedAt = new Date().toISOString();
  const snapshotToPersist: ComputedSnapshot = {
    ...snapshot,
    persistence: {
      ...snapshot.persistence,
      mode: "local_json",
      persisted: true,
      persistedAt,
      storeDir: getLocalStoreDirectory(),
    },
  };

  await Promise.all([
    fs.writeFile(
      latestSnapshotPath,
      JSON.stringify(snapshotToPersist, null, 2),
      "utf8",
    ),
    fs.writeFile(
      path.join(historyDir, `${snapshot.snapshotId}.json`),
      JSON.stringify(snapshotToPersist, null, 2),
      "utf8",
    ),
  ]);

  return {
    persisted: true,
    persistedAt,
  };
}

export async function readLatestPersistedSnapshot() {
  try {
    const { latestSnapshotPath } = await ensureStoreDirectories();
    const fileContents = await fs.readFile(latestSnapshotPath, "utf8");
    return JSON.parse(fileContents) as ComputedSnapshot;
  } catch {
    return null;
  }
}

export async function getLocalStoreStatus() {
  const { storeDir, latestSnapshotPath } = await ensureStoreDirectories();

  try {
    const stats = await fs.stat(latestSnapshotPath);
    return {
      mode: "local_json" as const,
      storeDir,
      hasLatestSnapshot: true,
      lastPersistedAt: stats.mtime.toISOString(),
    };
  } catch {
    return {
      mode: "local_json" as const,
      storeDir,
      hasLatestSnapshot: false,
      lastPersistedAt: null,
    };
  }
}
