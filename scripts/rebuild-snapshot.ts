import { getCurrentSnapshot } from "@/lib/ops/service";
import { toHackathonActionList } from "@/lib/ops/exporters";

async function main() {
  const snapshot = await getCurrentSnapshot({ forceRefresh: true, persist: true });

  console.log("Snapshot:", snapshot.snapshotId);
  console.log("Created:", snapshot.createdAt);
  console.log("Persisted:", snapshot.persistence.persistedAt ?? "no");
  console.log("Summary:", snapshot.summary);
  console.log("");
  console.log(JSON.stringify(toHackathonActionList(snapshot), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
