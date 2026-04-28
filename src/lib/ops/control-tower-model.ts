import { toHackathonActionList } from "@/lib/ops/exporters";
import type {
  ActionItem,
  CampaignRisk,
  ComputedSnapshot,
  InventoryPressure,
  NotificationItem,
  OrderRisk,
  TicketPriority,
} from "@/types/domain";

export interface ControlTowerPill {
  label: string;
  tone: "" | "crit" | "hot" | "info" | "ok" | "vip";
}

export interface ControlTowerSummaryToken {
  type: "text" | "strong" | "red" | "amber" | "green";
  value: string;
}

export interface ControlTowerAction {
  rank: number;
  type: string;
  severity: "critical" | "high" | "medium" | "resolved";
  title: string;
  reason: string;
  pills: ControlTowerPill[];
  confidence: number;
  owner: string;
  automation: boolean;
  evidence: {
    items: Array<{ l: string; v: string | number | boolean | null }>;
    note: string;
  };
}

export interface ControlTowerOrderRow {
  id: string;
  customer: string;
  vip: boolean;
  sku: string;
  city: string;
  ship: string;
  status: string;
  shippingStatus: string;
  eta: string;
  delayRisk: string;
  delayReason: string;
  deliveryAttempts: number;
  manualReview: boolean;
  risk: number;
  reason: string;
}

export interface ControlTowerInventoryRow {
  sku: string;
  name: string;
  stock: number;
  eta: string;
  through: number;
  views: number;
  cvr: string;
  camp: number;
  h: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface ControlTowerRadarItem {
  name: string;
  value: string;
  level: number;
  tone: "crit" | "hot" | "info" | "ok";
  note: string;
}

export interface ControlTowerAlert {
  sev: "crit" | "hot" | "info" | "ok";
  txt: string;
  src: string;
  time: string;
  isNew?: boolean;
}

export interface ControlTowerCardItem {
  kicker: string;
  title: string;
  body: string;
  tone: "crit" | "hot" | "info" | "ok" | "vip";
  badge: string;
  color: string;
  actions: Array<{ label: string; primary?: boolean }>;
}

export interface ControlTowerViewModel {
  launch: {
    name: string;
    code: string;
    started: string;
    status: string;
    units_total: number;
    units_sold: number;
    revenue: string;
    aov: string;
    sessions: number;
    cvr: string;
  };
  kpis: Array<{ k: string; v: string | number; delta: string; tone: string }>;
  summary: ControlTowerSummaryToken[];
  actions: ControlTowerAction[];
  radar: ControlTowerRadarItem[];
  alerts: ControlTowerAlert[];
  orders: ControlTowerOrderRow[];
  inventory: ControlTowerInventoryRow[];
  supportItems: ControlTowerCardItem[];
  campaignItems: ControlTowerCardItem[];
  notificationItems: ControlTowerCardItem[];
  jsonData: ReturnType<typeof toHackathonActionList>;
}

function severityTone(severity: ActionItem["severity"] | OrderRisk["severity"]) {
  switch (severity) {
    case "critical":
      return "crit" as const;
    case "high":
      return "hot" as const;
    case "medium":
      return "info" as const;
    default:
      return "ok" as const;
  }
}

function formatRelativeLabel(_startedAt: string | null, currentIso: string) {
  if (!currentIso) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(currentIso));
}

function toDesignSeverity(action: ActionItem) {
  if (action.status === "resolved") {
    return "resolved";
  }

  if (action.severity === "info") {
    return "medium";
  }

  return action.severity;
}

function actionPills(action: ActionItem): ControlTowerPill[] {
  const pills: ControlTowerPill[] = [];

  if (action.reason.toLowerCase().includes("vip")) {
    pills.push({ label: "VIP en riesgo", tone: "vip" });
  }
  if (action.reason.toLowerCase().includes("stock")) {
    pills.push({ label: "stock tensionado", tone: "crit" });
  }
  if (action.reason.toLowerCase().includes("ticket")) {
    pills.push({ label: "ticket abierto", tone: "hot" });
  }
  if (action.reason.toLowerCase().includes("express")) {
    pills.push({ label: "express", tone: "hot" });
  }
  if (action.automationPossible) {
    pills.push({ label: "automatizable", tone: "ok" });
  }

  pills.push({
    label:
      action.targetType === "campaign"
        ? "campana"
        : action.targetType === "sku"
          ? "sku"
          : action.targetType === "ticket"
            ? "soporte"
            : action.targetType === "customer"
              ? "cliente"
              : "pedido",
    tone: "",
  });

  return pills.slice(0, 4);
}

function humanOwner(owner: ActionItem["owner"]) {
  switch (owner) {
    case "growth":
      return "Resp. de marketing";
    case "inventory":
      return "Resp. de logistica";
    case "support":
      return "Resp. de soporte";
    default:
      return "Resp. de operaciones";
  }
}

function toActionView(action: ActionItem): ControlTowerAction {
  return {
    rank: action.rank,
    type: action.actionType.toUpperCase(),
    severity: toDesignSeverity(action),
    title: action.title,
    reason: action.reason,
    pills: actionPills(action),
    confidence: action.confidence,
    owner: humanOwner(action.owner),
    automation: action.automationPossible,
    evidence: {
      items: action.evidence.map((item) => ({
        l: item.label.replace(/_/g, " "),
        v: item.value,
      })),
      note: action.expectedImpact,
    },
  };
}

function toOrderStatus(risk: OrderRisk["severity"], reasons: string[]) {
  if (risk === "critical") {
    return "Retrasado";
  }
  if (reasons.some((reason) => reason.toLowerCase().includes("payment review"))) {
    return "Pendiente";
  }
  if (risk === "high") {
    return "Pendiente";
  }
  if (risk === "medium") {
    return "Confirmado";
  }
  return "Resuelto";
}

function formatShippingStatus(status: OrderRisk["shippingStatus"]) {
  if (!status) {
    return "No consultado";
  }

  switch (status.shippingStatus) {
    case "label_created":
      return "Etiqueta creada";
    case "picked_up":
      return "Recogido";
    case "in_transit":
      return "En transito";
    case "at_sorting_center":
      return "En clasificacion";
    case "out_for_delivery":
      return "En reparto";
    case "delivered":
      return "Entregado";
    case "delayed":
      return "Retrasado";
    case "exception":
      return "Incidencia";
    case "lost":
      return "Perdido";
    case "returned_to_sender":
      return "Devuelto";
    default:
      return "Desconocido";
  }
}

function formatDelayReason(reason: OrderRisk["shippingStatus"] | null) {
  if (!reason?.delayReason) {
    return "-";
  }

  return String(reason.delayReason).replace(/_/g, " ");
}

function toOrderView(item: OrderRisk): ControlTowerOrderRow {
  const shippingStatus = item.shippingStatus;

  return {
    id: item.orderId,
    customer: item.customerId,
    vip: item.isVip,
    sku: item.sku,
    city:
      item.evidence.find((e) => e.label === "shipping_method")?.value === "express"
        ? "Madrid"
      : "ES",
    ship: item.shippingMethod === "express" ? "Express" : "Estandar",
    status: toOrderStatus(item.severity, item.reasons),
    shippingStatus: formatShippingStatus(shippingStatus),
    eta: shippingStatus?.estimatedDeliveryDate?.slice(0, 10) ?? "-",
    delayRisk: shippingStatus ? `${Math.round(shippingStatus.delayRisk * 100)}%` : "-",
    delayReason: formatDelayReason(shippingStatus),
    deliveryAttempts: shippingStatus?.deliveryAttempts ?? 0,
    manualReview: shippingStatus?.requiresManualReview ?? false,
    risk: Math.round(item.score * 100),
    reason: item.reasons.join(" / "),
  };
}

function pressureBand(score: number): ControlTowerInventoryRow["h"] {
  if (score >= 0.9) return 5;
  if (score >= 0.8) return 4;
  if (score >= 0.65) return 3;
  if (score >= 0.45) return 2;
  if (score >= 0.25) return 1;
  return 0;
}

function toInventoryView(item: InventoryPressure): ControlTowerInventoryRow {
  return {
    sku: item.sku,
    name: item.productName ?? item.sku,
    stock: item.availableUnits,
    eta: item.incomingEta ? item.incomingEta.slice(11, 16) : "-",
    through: Math.round(item.sellThroughLastHour * 100),
    views: item.pageViewsLastHour,
    cvr: `${Math.round(item.conversionRateLastHour * 1000) / 10}%`,
    camp: item.activeCampaignIds.length,
    h: pressureBand(item.score),
  };
}

function radarLevel(items: number, max: number) {
  return Math.max(8, Math.min(95, Math.round((items / Math.max(max, 1)) * 100)));
}

function toRadar(snapshot: ComputedSnapshot): ControlTowerRadarItem[] {
  const criticalInventory = snapshot.inventoryPressure.filter(
    (item) => item.severity === "critical" || item.severity === "high",
  );
  const urgentSupport = snapshot.ticketPriority.filter(
    (item) => item.severity === "critical" || item.severity === "high",
  );
  const logistics = snapshot.orderRisks.filter(
    (item) => item.shippingMethod === "express" && item.score >= 0.62,
  );
  const campaigns = snapshot.campaignRisks.filter(
    (item) => item.severity === "critical" || item.severity === "high",
  );
  const customers = snapshot.orderRisks.filter((item) => item.isVip);

  return [
    {
      name: "Inventario",
      value: criticalInventory.length > 0 ? "ALTO" : "CONTROL",
      level: radarLevel(criticalInventory.length, 5),
      tone: criticalInventory.length > 0 ? "crit" : "ok",
      note: `${criticalInventory.length} SKU bajo presion inmediata`,
    },
    {
      name: "Soporte",
      value: urgentSupport.length > 4 ? "ALTO" : "MEDIO",
      level: radarLevel(urgentSupport.length, 8),
      tone: urgentSupport.length > 4 ? "hot" : "info",
      note: `${urgentSupport.length} tickets urgentes o altos`,
    },
    {
      name: "Logistica",
      value: logistics.length > 5 ? "ELEVADO" : "MEDIO",
      level: radarLevel(logistics.length, 10),
      tone: logistics.length > 5 ? "hot" : "info",
      note: `${logistics.length} pedidos express en riesgo`,
    },
    {
      name: "Campanas",
      value: campaigns.length > 0 ? "ALTO" : "OK",
      level: radarLevel(campaigns.length, 4),
      tone: campaigns.length > 0 ? "info" : "ok",
      note: `${campaigns.length} campanas requieren revision`,
    },
    {
      name: "Clientes",
      value: customers.length > 0 ? "SENSIBLE" : "NORMAL",
      level: radarLevel(customers.length, 6),
      tone: customers.length > 0 ? "hot" : "ok",
      note: `${customers.length} pedidos VIP expuestos`,
    },
    {
      name: "Confianza",
      value: "ESTABLE",
      level: Math.round(
        (snapshot.topActions.reduce((sum, action) => sum + action.confidence, 0) /
          Math.max(snapshot.topActions.length, 1)) *
          100,
      ),
      tone: "ok",
      note: "Modelo determinista sobre datos normalizados",
    },
  ];
}

function toAlert(
  item: NotificationItem,
  startedAt: string | null,
): ControlTowerAlert {
  return {
    sev:
      item.severity === "critical"
        ? "crit"
        : item.severity === "high"
          ? "hot"
          : item.severity === "medium"
            ? "info"
            : "ok",
    txt: item.title,
    src:
      item.category === "data_quality"
        ? "dataset.guard"
        : item.category.includes("campaign")
          ? "campaign.monitor"
          : item.category.includes("ticket")
            ? "support.snapshot"
            : item.category.includes("stock")
              ? "inventory.snapshot"
              : "ops.actions",
    time: formatRelativeLabel(startedAt, item.createdAt),
    isNew: item.deliveryStatus === "pending",
  };
}

function supportCard(ticket: TicketPriority): ControlTowerCardItem {
  const tone = severityTone(ticket.severity);

  return {
    kicker: ticket.ticketId,
    title: ticket.orderId
      ? `Pedido ${ticket.orderId} bajo friccion`
      : `Escalado para ${ticket.customerId ?? "cliente"}`,
    body: `${ticket.reasons.join(" / ")}${ticket.message ? `. "${ticket.message}"` : ""}`,
    tone,
    badge: ticket.urgency.toUpperCase(),
    color:
      tone === "crit"
        ? "var(--burgundy)"
        : tone === "hot"
          ? "var(--high)"
          : "var(--safari)",
    actions: [
      { label: "Abrir ticket", primary: true },
      { label: "Responder" },
    ],
  };
}

function campaignCard(campaign: CampaignRisk): ControlTowerCardItem {
  const tone = severityTone(campaign.severity);
  const primaryLabel =
    campaign.severity === "critical" ? "Pausar ahora" : "Bajar presupuesto";

  return {
    kicker: campaign.campaignId,
    title: `${campaign.targetCity ?? "ES"} / ${campaign.targetSku ?? "campaign"}`,
    body: campaign.reasons.join(" / "),
    tone,
    badge:
      campaign.severity === "critical"
        ? "PAUSE"
        : campaign.severity === "high"
          ? "LIMIT"
          : "MONITOR",
    color:
      tone === "crit"
        ? "var(--burgundy)"
        : tone === "hot"
          ? "var(--high)"
          : "var(--safari)",
    actions: [
      { label: primaryLabel, primary: true },
      { label: "Ver informe" },
    ],
  };
}

function notificationCard(item: ControlTowerAlert): ControlTowerCardItem {
  return {
    kicker: item.time,
    title: item.txt,
    body: `Origen: ${item.src}. ${item.isNew ? "Estado: NEW." : "Estado: enviado."}`,
    tone:
      item.sev === "crit"
        ? "crit"
        : item.sev === "hot"
          ? "hot"
          : item.sev === "info"
            ? "info"
            : "ok",
    badge: item.sev.toUpperCase(),
    color:
      item.sev === "crit"
        ? "var(--burgundy)"
        : item.sev === "hot"
          ? "var(--high)"
          : item.sev === "info"
            ? "var(--safari)"
            : "var(--olive)",
    actions: [{ label: "Ver", primary: true }, { label: "Reenviar" }],
  };
}

export function buildControlTowerViewModel(
  snapshot: ComputedSnapshot,
): ControlTowerViewModel {
  const actions = snapshot.topActions.map(toActionView);
  const alerts = snapshot.notifications.map((item) =>
    toAlert(item, snapshot.launch.startedAt),
  );
  const shippingEscalations = snapshot.orderRisks.filter(
    (item) =>
      item.shippingStatus &&
      (item.shippingStatus.requiresManualReview ||
        item.shippingStatus.delayRisk >= 0.45 ||
        ["delayed", "exception", "lost", "returned_to_sender"].includes(
          item.shippingStatus.shippingStatus,
        )),
  ).length;

  return {
    launch: {
      name: snapshot.launch.name,
      code: snapshot.launch.code,
      started: snapshot.launch.started,
      status: snapshot.launch.status,
      units_total: snapshot.launch.unitsTotal,
      units_sold: snapshot.launch.unitsSold,
      revenue: snapshot.launch.revenueLabel,
      aov: snapshot.launch.aovLabel,
      sessions: snapshot.launch.sessions,
      cvr: snapshot.launch.cvrLabel,
    },
    kpis: [
      {
        k: "Riesgos activos",
        v:
          snapshot.orderRisks.filter((item) => item.score >= 0.62).length +
          snapshot.ticketPriority.filter((item) => item.score >= 0.64).length,
        delta: `${snapshot.topActions.length} acciones priorizadas`,
        tone: "crit",
      },
      {
        k: "SKUs criticos",
        v: snapshot.metrics.criticalSkus,
        delta: `${snapshot.inventoryPressure.length} monitorizados`,
        tone: "crit",
      },
      {
        k: "Tickets urgentes",
        v: snapshot.metrics.urgentTickets,
        delta: `${snapshot.ticketPriority.length} en soporte`,
        tone: "hot",
      },
      {
        k: "Bloqueos shipping",
        v: shippingEscalations,
        delta: "pedidos reordenados con API real",
        tone: "hot",
      },
      {
        k: "VIPs impactados",
        v: snapshot.metrics.vipOrdersAtRisk,
        delta: "pedidos sensibles en cola",
        tone: "",
      },
      {
        k: "Confianza",
        v: (
          snapshot.topActions.reduce((sum, action) => sum + action.confidence, 0) /
          Math.max(snapshot.topActions.length, 1)
        ).toFixed(2),
        delta: "modelo / snapshot actual",
        tone: "brand",
      },
    ],
    summary: [
      { type: "text", value: "Drop 04 arranco a las " },
      { type: "strong", value: snapshot.launch.started },
      { type: "text", value: " en vivo. " },
      { type: "amber", value: `${snapshot.metrics.criticalSkus} SKU criticos` },
      { type: "text", value: " y " },
      { type: "amber", value: `${snapshot.metrics.urgentTickets} tickets urgentes` },
      { type: "text", value: ". Shipping API confirma " },
      { type: "red", value: `${shippingEscalations} bloqueos logisticos` },
      { type: "text", value: ". La accion mas inmediata es " },
      {
        type: "red",
        value: snapshot.topActions[0]?.title ?? "revisar el lanzamiento",
      },
      { type: "text", value: "." },
    ],
    actions,
    radar: toRadar(snapshot),
    alerts,
    orders: snapshot.orderRisks.slice(0, 10).map(toOrderView),
    inventory: snapshot.inventoryPressure.slice(0, 8).map(toInventoryView),
    supportItems: snapshot.ticketPriority.slice(0, 4).map(supportCard),
    campaignItems: snapshot.campaignRisks.slice(0, 4).map(campaignCard),
    notificationItems: alerts.slice(0, 6).map(notificationCard),
    jsonData: toHackathonActionList(snapshot),
  };
}
