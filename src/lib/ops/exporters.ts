import { getLocalStoreDirectory } from "@/lib/config/app-config";
import type { ActionItem, ComputedSnapshot, DashboardOverview } from "@/types/domain";

export function toDashboardOverview(snapshot: ComputedSnapshot): DashboardOverview {
  return {
    snapshotId: snapshot.snapshotId,
    createdAt: snapshot.createdAt,
    summary: snapshot.summary,
    metrics: snapshot.metrics,
    topActions: snapshot.topActions,
    counts: {
      criticalOrders: snapshot.orderRisks.filter((risk) => risk.severity === "critical").length,
      highOrders: snapshot.orderRisks.filter((risk) => risk.severity === "high").length,
      criticalInventory: snapshot.inventoryPressure.filter(
        (risk) => risk.severity === "critical",
      ).length,
      highInventory: snapshot.inventoryPressure.filter((risk) => risk.severity === "high").length,
      urgentTicketItems: snapshot.ticketPriority.filter(
        (ticket) => ticket.urgency === "urgent" || ticket.urgency === "high",
      ).length,
      criticalCampaigns: snapshot.campaignRisks.filter(
        (campaign) => campaign.severity === "critical",
      ).length,
    },
    datasetWarnings: snapshot.warnings,
    persistence: {
      mode: "local_json",
      lastPersistedAt: snapshot.persistence.persistedAt,
      storeDir: snapshot.persistence.storeDir || getLocalStoreDirectory(),
    },
  };
}

export function toHackathonAction(action: ActionItem) {
  return {
    rank: action.rank,
    action_type: action.actionType,
    target_id: action.targetId,
    title: action.title,
    reason: action.reason,
    expected_impact: action.expectedImpact,
    confidence: action.confidence,
    owner: action.owner,
    automation_possible: action.automationPossible,
  };
}

export function toHackathonActionList(snapshot: ComputedSnapshot) {
  return snapshot.topActions.map(toHackathonAction);
}
