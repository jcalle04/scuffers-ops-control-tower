import path from "node:path";

export const REQUIRED_DATA_FILES = [
  "orders.csv",
  "order_items.csv",
  "customers.csv",
  "inventory.csv",
  "support_tickets.csv",
  "campaigns.csv",
] as const;

export function getDatasetDirectory() {
  const configuredPath = process.env.SCUFFERS_DATASET_DIR?.trim();

  if (configuredPath) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredPath);
  }

  return path.join(process.cwd(), "data", "candidate_csvs");
}

export function getBundledStoreDirectory() {
  return path.join(process.cwd(), "storage", "demo-state");
}

export function getLocalStoreDirectory() {
  if (process.env.VERCEL === "1") {
    return path.join("/tmp", "scuffers-ops-control-tower", "demo-state");
  }

  return getBundledStoreDirectory();
}

export function getShippingStatusApiConfig() {
  return {
    baseUrl:
      process.env.SCUFFERS_SHIPPING_STATUS_API_BASE_URL?.trim() ||
      "https://lkuutmnykcnbfmbpopcu.functions.supabase.co/api/shipping-status",
    candidateId: process.env.SCUFFERS_CANDIDATE_ID?.trim() || "SCF-2026-7240",
    relevantOrderLimit: Number.parseInt(
      process.env.SCUFFERS_SHIPPING_STATUS_RELEVANT_LIMIT?.trim() || "18",
      10,
    ),
    timeoutMs: Number.parseInt(
      process.env.SCUFFERS_SHIPPING_STATUS_TIMEOUT_MS?.trim() || "2500",
      10,
    ),
  };
}

export function getAppThresholds() {
  return {
    actionLimit: 10,
    datasetCacheMs: 30_000,
    severity: {
      critical: 0.85,
      high: 0.68,
      medium: 0.42,
    },
  };
}
