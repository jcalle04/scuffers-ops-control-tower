import { ControlTowerDashboard } from "@/components/control-tower-dashboard";
import { buildControlTowerViewModel } from "@/lib/ops/control-tower-model";
import { getCurrentSnapshot } from "@/lib/ops/service";

export default async function Home() {
  const snapshot = await getCurrentSnapshot();
  const viewModel = buildControlTowerViewModel(snapshot);

  return <ControlTowerDashboard initialData={viewModel} />;
}
