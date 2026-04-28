import { promises as fs } from "node:fs";
import path from "node:path";
import Papa, { type ParseError } from "papaparse";

import { getDatasetDirectory, REQUIRED_DATA_FILES } from "@/lib/config/app-config";

export async function readCsvRows<T>(
  fileName: (typeof REQUIRED_DATA_FILES)[number],
) {
  const filePath = path.join(getDatasetDirectory(), fileName);
  const fileContents = await fs.readFile(filePath, "utf8");

  const parsed = Papa.parse<Record<string, string>>(fileContents, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  return {
    filePath,
    rows: parsed.data
      .filter((row: Record<string, string>) =>
        Object.values(row).some((value) => String(value ?? "").trim().length > 0),
      )
      .map((row) => row as T),
    errors: parsed.errors as ParseError[],
  };
}

export async function getDatasetFingerprint() {
  const datasetDir = getDatasetDirectory();
  const fingerprintParts = await Promise.all(
    REQUIRED_DATA_FILES.map(async (fileName) => {
      const filePath = path.join(datasetDir, fileName);
      const stats = await fs.stat(filePath);
      return `${fileName}:${stats.size}:${stats.mtimeMs}`;
    }),
  );

  return {
    datasetDir,
    fingerprint: fingerprintParts.join("|"),
  };
}
