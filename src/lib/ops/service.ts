import { getAppThresholds, getLocalStoreDirectory } from "@/lib/config/app-config";
import { getDatasetFingerprint } from "@/lib/csv/read-csv";
import { buildComputedSnapshot } from "@/lib/ops/engine";
import { persistSnapshot, readLatestPersistedSnapshot } from "@/lib/storage/snapshot-store";
import type { ComputedSnapshot } from "@/types/domain";

let snapshotCache:
  | {
      fingerprint: string;
      createdAtMs: number;
      snapshot: ComputedSnapshot;
    }
  | null = null;

export async function getCurrentSnapshot(options?: {
  forceRefresh?: boolean;
  persist?: boolean;
}) {
  const { forceRefresh = false, persist = true } = options ?? {};
  const { fingerprint } = await getDatasetFingerprint();
  const { datasetCacheMs } = getAppThresholds();

  if (
    !forceRefresh &&
    snapshotCache &&
    snapshotCache.fingerprint === fingerprint &&
    Date.now() - snapshotCache.createdAtMs < datasetCacheMs
  ) {
    return snapshotCache.snapshot;
  }

  try {
    const computed = await buildComputedSnapshot(fingerprint);

    if (persist) {
      const persisted = await persistSnapshot(computed);
      computed.persistence = {
        mode: "local_json",
        persisted: persisted.persisted,
        persistedAt: persisted.persistedAt,
        storeDir: getLocalStoreDirectory(),
      };
    } else {
      computed.persistence = {
        mode: "local_json",
        persisted: false,
        persistedAt: null,
        storeDir: getLocalStoreDirectory(),
      };
    }

    snapshotCache = {
      fingerprint,
      createdAtMs: Date.now(),
      snapshot: computed,
    };

    return computed;
  } catch (error) {
    const persistedSnapshot = await readLatestPersistedSnapshot();

    if (persistedSnapshot) {
      return {
        ...persistedSnapshot,
        warnings: [
          `No se pudo recalcular el snapshot actual. Se usa la ultima version persistida. ${error instanceof Error ? error.message : "Error desconocido."}`,
          ...persistedSnapshot.warnings,
        ],
      };
    }

    throw error;
  }
}
