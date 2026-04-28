import { createHash } from "node:crypto";

import {
  getDatasetDirectory,
  getShippingStatusApiConfig,
} from "@/lib/config/app-config";
import { readCsvRows } from "@/lib/csv/read-csv";
import { fetchRelevantShippingStatuses } from "@/lib/shipping/shipping-status";
import {
  clamp,
  confidenceFromFlags,
  normalizeCampaignIntensity,
  normalizeCampaignStatus,
  normalizeCustomerSegment,
  normalizeOrderStatus,
  normalizeSupportSentiment,
  normalizeSupportUrgency,
  parseBoolean,
  parseInteger,
  parseIsoDate,
  parseMoney,
  parseNumber,
  round,
  safeString,
  scoreFromCampaignIntensity,
  scoreFromSentiment,
  scoreFromUrgency,
  severityFromScore,
} from "@/lib/utils/parsers";
import type {
  ActionItem,
  CampaignRisk,
  ComputedSnapshot,
  EvidenceItem,
  InventoryPressure,
  NormalizedCampaign,
  NormalizedCustomer,
  NormalizedDataset,
  NormalizedInventoryItem,
  NormalizedOrder,
  NormalizedSupportTicket,
  NotificationItem,
  OrderRisk,
  RawCampaignRow,
  RawCustomerRow,
  RawInventoryRow,
  RawOrderItemRow,
  RawOrderRow,
  RawSupportTicketRow,
  ShippingStatus,
  ShippingStatusSnapshot,
  SnapshotMetrics,
  TicketPriority,
} from "@/types/domain";

function dedupe<T>(items: T[]) {
  return Array.from(new Set(items));
}

function buildEvidence(
  type: string,
  label: string,
  value: string | number | boolean | null,
  weight: number,
): EvidenceItem {
  return {
    type,
    label,
    value,
    weight: round(weight),
  };
}

function makeActionId(snapshotId: string, key: string) {
  return createHash("sha1").update(`${snapshotId}:${key}`).digest("hex").slice(0, 16);
}

function makeSummary(
  metrics: SnapshotMetrics,
  topActions: ActionItem[],
  campaignRisks: CampaignRisk[],
  orderRisks: OrderRisk[],
) {
  const highlights = topActions
    .slice(0, 3)
    .map((action) => action.title)
    .join("; ");
  const shippingAlerts = orderRisks.filter(
    (risk) =>
      risk.shippingStatus &&
      (risk.shippingStatus.requiresManualReview ||
        risk.shippingStatus.delayRisk >= 0.45 ||
        ["delayed", "exception", "lost", "returned_to_sender"].includes(
          risk.shippingStatus.shippingStatus,
        )),
  ).length;
  const shippingLine =
    shippingAlerts > 0
      ? `La Shipping Status API confirma ${shippingAlerts} pedidos con riesgo logistico real.`
      : "La Shipping Status API no ha detectado bloqueos logisticos criticos en los pedidos consultados.";

  return [
    `Lanzamiento bajo presion: ${metrics.criticalSkus} SKU criticos, ${metrics.urgentTickets} tickets urgentes y ${campaignRisks.filter((risk) => risk.severity === "critical").length} colisiones campana-stock de alta prioridad. ${shippingLine}`,
    highlights ? `Foco inmediato: ${highlights}.` : "Todavia no hay acciones priorizadas.",
  ].join(" ");
}
function buildMetrics(
  dataset: NormalizedDataset,
  orderRisks: OrderRisk[],
  inventoryPressure: InventoryPressure[],
  ticketPriority: TicketPriority[],
  topActions: ActionItem[],
): SnapshotMetrics {
  return {
    totalOrders: dataset.orders.length,
    totalCustomers: dataset.customers.length,
    totalTickets: dataset.tickets.length,
    activeCampaigns: dataset.campaigns.filter((campaign) => campaign.status === "active")
      .length,
    criticalSkus: inventoryPressure.filter((item) => item.severity === "critical").length,
    urgentTickets: ticketPriority.filter(
      (ticket) => ticket.urgency === "urgent" || ticket.urgency === "high",
    ).length,
    vipOrdersAtRisk: orderRisks.filter(
      (risk) => risk.isVip && (risk.severity === "critical" || risk.severity === "high"),
    ).length,
    topActionsCount: topActions.length,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${round(value * 100, 2)}%`;
}

function formatMadridClock(isoDate: string | null) {
  if (!isoDate) {
    return "--:--";
  }

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoDate));
}

function formatElapsedLabel(startedAt: string | null, _nowIso: string) {
  if (!startedAt) {
    return "--:--";
  }

  return formatMadridClock(startedAt);
}

function buildLaunchSnapshot(dataset: NormalizedDataset, createdAt: string) {
  const createdDates = [
    ...dataset.orders.map((order) => order.createdAt).filter(Boolean),
    ...dataset.campaigns.map((campaign) => campaign.startedAt).filter(Boolean),
  ] as string[];
  const startedAt =
    createdDates.length > 0
      ? createdDates.sort((left, right) => left.localeCompare(right))[0]
      : null;

  const unitsSold = dataset.orders.reduce((sum, order) => sum + order.quantity, 0);
  const unitsTotal =
    unitsSold +
    dataset.inventory.reduce(
      (sum, item) => sum + item.availableUnits + item.reservedUnits,
      0,
    );
  const revenue = dataset.orders.reduce(
    (sum, order) => sum + (order.orderValue ?? 0),
    0,
  );
  const sessions = dataset.inventory.reduce(
    (sum, item) => sum + item.pageViewsLastHour,
    0,
  );
  const aov = dataset.orders.length > 0 ? revenue / dataset.orders.length : 0;
  const cvr = sessions > 0 ? dataset.orders.length / sessions : 0;

  return {
    name: "DROP 04 - ECRU CAPSULE",
    code: "DRP-04-ECR",
    startedAt,
    started: formatElapsedLabel(startedAt, createdAt),
    status:
      dataset.tickets.some((ticket) => ticket.urgency === "urgent") ||
      dataset.campaigns.some((campaign) => campaign.intensity === "very_high")
        ? "EN VIVO / ALTA PRESION"
        : "EN VIVO / ESTABLE",
    unitsTotal,
    unitsSold,
    revenue,
    revenueLabel: formatCurrency(revenue),
    aov,
    aovLabel: formatCurrency(aov),
    sessions,
    cvr,
    cvrLabel: formatPercent(cvr),
  };
}

async function loadNormalizedDataset() {
  const [ordersSource, itemsSource, customersSource, inventorySource, ticketsSource, campaignsSource] =
    await Promise.all([
      readCsvRows<RawOrderRow>("orders.csv"),
      readCsvRows<RawOrderItemRow>("order_items.csv"),
      readCsvRows<RawCustomerRow>("customers.csv"),
      readCsvRows<RawInventoryRow>("inventory.csv"),
      readCsvRows<RawSupportTicketRow>("support_tickets.csv"),
      readCsvRows<RawCampaignRow>("campaigns.csv"),
    ]);

  const warnings = [
    ...ordersSource.errors.map((error) => `orders.csv: ${error.message}`),
    ...itemsSource.errors.map((error) => `order_items.csv: ${error.message}`),
    ...customersSource.errors.map((error) => `customers.csv: ${error.message}`),
    ...inventorySource.errors.map((error) => `inventory.csv: ${error.message}`),
    ...ticketsSource.errors.map((error) => `support_tickets.csv: ${error.message}`),
    ...campaignsSource.errors.map((error) => `campaigns.csv: ${error.message}`),
  ];

  const orderItemsByOrderId = new Map<string, RawOrderItemRow>();
  for (const item of itemsSource.rows) {
    const orderId = safeString(item.order_id);
    if (orderId && !orderItemsByOrderId.has(orderId)) {
      orderItemsByOrderId.set(orderId, item);
    }
  }

  const inventoryBySkuRaw = new Map<string, RawInventoryRow>();
  for (const item of inventorySource.rows) {
    const sku = safeString(item.sku);
    if (sku && !inventoryBySkuRaw.has(sku)) {
      inventoryBySkuRaw.set(sku, item);
    }
  }

  const customers = customersSource.rows
    .map<NormalizedCustomer | null>((row) => {
      const customerId = safeString(row.customer_id);
      if (!customerId) {
        return null;
      }

      return {
        id: customerId,
        segment: normalizeCustomerSegment(row.customer_segment),
        lifetimeValue: parseMoney(row.customer_lifetime_value) ?? 0,
        ordersCount: parseInteger(row.customer_orders_count),
        returnsCount: parseInteger(row.customer_returns_count),
        isVip: parseBoolean(row.is_vip),
        preferredCity: safeString(row.preferred_city),
        emailOptIn: parseBoolean(row.email_opt_in),
      };
    })
    .filter((customer): customer is NormalizedCustomer => Boolean(customer));

  const customersById = new Map(customers.map((customer) => [customer.id, customer]));

  const inventory = inventorySource.rows
    .map<NormalizedInventoryItem | null>((row) => {
      const sku = safeString(row.sku);
      if (!sku) {
        return null;
      }

      const dataQualityFlags: string[] = [];
      const availableUnits = parseInteger(row.inventory_available_units);
      const reservedUnits = parseInteger(row.inventory_reserved_units);

      if (row.inventory_available_units === undefined) {
        dataQualityFlags.push("missing_available_units");
      }
      if (row.sell_through_rate_last_hour === undefined) {
        dataQualityFlags.push("missing_sell_through_rate");
      }

      return {
        sku,
        productName: safeString(row.product_name),
        category: safeString(row.category),
        size: safeString(row.size),
        unitPrice: parseMoney(row.unit_price),
        warehouseStock: parseInteger(row.warehouse_stock),
        availableUnits,
        reservedUnits,
        incomingUnits: parseInteger(row.inventory_incoming_units),
        incomingEta: parseIsoDate(row.inventory_incoming_eta),
        sellThroughLastHour: clamp(parseNumber(row.sell_through_rate_last_hour), 0, 1.2),
        pageViewsLastHour: parseInteger(row.product_page_views_last_hour),
        conversionRateLastHour: clamp(parseNumber(row.conversion_rate_last_hour), 0, 1),
        dataQualityFlags,
      };
    })
    .filter((item): item is NormalizedInventoryItem => Boolean(item));

  const orders = ordersSource.rows
    .map<NormalizedOrder | null>((row) => {
      const orderId = safeString(row.order_id);
      const customerId = safeString(row.customer_id);
      const sku = safeString(row.sku);

      if (!orderId || !customerId || !sku) {
        return null;
      }

      const dataQualityFlags: string[] = [];
      const orderItem = orderItemsByOrderId.get(orderId);
      const inventoryItem = inventoryBySkuRaw.get(sku);
      const customer = customersById.get(customerId);
      const orderValue = parseMoney(row.order_value);
      const orderSegment = normalizeCustomerSegment(row.customer_segment);
      const resolvedSegment =
        orderSegment !== "unknown" ? orderSegment : customer?.segment ?? "unknown";

      if (orderValue === null) {
        dataQualityFlags.push("missing_order_value");
      }
      if (resolvedSegment === "unknown") {
        dataQualityFlags.push("missing_customer_segment");
      }
      if (!orderItem && !inventoryItem) {
        dataQualityFlags.push("missing_product_context");
      }

      return {
        id: orderId,
        customerId,
        createdAt: parseIsoDate(row.created_at),
        status: normalizeOrderStatus(row.order_status),
        sku,
        quantity: Math.max(parseInteger(row.quantity, 1), 1),
        orderValue,
        shippingCity: safeString(row.shipping_city),
        shippingCountry: safeString(row.shipping_country),
        shippingMethod: safeString(row.shipping_method)?.toLowerCase() ?? null,
        customerSegment: resolvedSegment,
        campaignSource: safeString(row.campaign_source)?.toLowerCase() ?? null,
        productName:
          safeString(orderItem?.product_name) ?? safeString(inventoryItem?.product_name),
        category: safeString(orderItem?.category) ?? safeString(inventoryItem?.category),
        size: safeString(orderItem?.size) ?? safeString(inventoryItem?.size),
        dataQualityFlags,
      };
    })
    .filter((order): order is NormalizedOrder => Boolean(order));

  const tickets = ticketsSource.rows
    .map<NormalizedSupportTicket | null>((row) => {
      const ticketId = safeString(row.ticket_id);
      if (!ticketId) {
        return null;
      }

      return {
        id: ticketId,
        orderId: safeString(row.order_id),
        customerId: safeString(row.customer_id),
        createdAt: parseIsoDate(row.created_at),
        channel: safeString(row.channel),
        message: safeString(row.support_ticket_message),
        urgency: normalizeSupportUrgency(row.support_ticket_urgency),
        sentiment: normalizeSupportSentiment(row.support_ticket_sentiment),
      };
    })
    .filter((ticket): ticket is NormalizedSupportTicket => Boolean(ticket));

  const campaigns = campaignsSource.rows
    .map<NormalizedCampaign | null>((row) => {
      const campaignId = safeString(row.campaign_id);
      if (!campaignId) {
        return null;
      }

      return {
        id: campaignId,
        source: safeString(row.campaign_source)?.toLowerCase() ?? null,
        status: normalizeCampaignStatus(row.status),
        targetSku: safeString(row.target_sku),
        targetCity: safeString(row.target_city),
        intensity: normalizeCampaignIntensity(row.campaign_intensity),
        budgetSpent: parseMoney(row.budget_spent) ?? 0,
        trafficGrowth: parseNumber(row.traffic_growth),
        conversionRate: clamp(parseNumber(row.conversion_rate), 0, 1),
        startedAt: parseIsoDate(row.started_at),
      };
    })
    .filter((campaign): campaign is NormalizedCampaign => Boolean(campaign));

  return {
    orders,
    customers,
    inventory,
    tickets,
    campaigns,
    warnings,
  } satisfies NormalizedDataset;
}

function buildInventoryPressure(
  dataset: NormalizedDataset,
  campaignsBySku: Map<string, NormalizedCampaign[]>,
) {
  return dataset.inventory
    .map<InventoryPressure>((item) => {
      const activeCampaigns = campaignsBySku.get(item.sku) ?? [];
      const activeCampaignIds = activeCampaigns.map((campaign) => campaign.id);
      const maxCampaignIntensity = Math.max(
        0,
        ...activeCampaigns.map((campaign) => scoreFromCampaignIntensity(campaign.intensity)),
      );
      const expectedDemand = item.pageViewsLastHour * item.conversionRateLastHour;
      const stockScarcity = clamp((6 - item.availableUnits) / 6, 0, 1);
      const reservedPressure = clamp(
        item.reservedUnits / Math.max(item.availableUnits + item.reservedUnits, 1),
        0,
        1,
      );
      const demandPressure = clamp(expectedDemand / 85, 0, 1);
      const incomingRelief = item.incomingUnits > 0 ? clamp(item.incomingUnits / 40, 0, 0.8) : 0;
      const score = clamp(
        0.34 * stockScarcity +
          0.18 * reservedPressure +
          0.18 * clamp(item.sellThroughLastHour, 0, 1) +
          0.16 * demandPressure +
          0.16 * maxCampaignIntensity -
          0.12 * incomingRelief,
        0,
        1,
      );
      const severity = severityFromScore(score);
      const reasons: string[] = [];

      if (item.availableUnits <= 3) {
        reasons.push(`Stock disponible critico (${item.availableUnits} uds)`);
      }
      if (activeCampaignIds.length > 0) {
        reasons.push(`Campanas activas presionando el SKU (${activeCampaignIds.join(", ")})`);
      }
      if (item.sellThroughLastHour >= 0.65) {
        reasons.push("Sell-through muy alto en la ultima hora");
      }
      if (item.incomingUnits === 0) {
        reasons.push("Sin reposicion entrante confirmada");
      }

      return {
        sku: item.sku,
        productName: item.productName,
        category: item.category,
        availableUnits: item.availableUnits,
        reservedUnits: item.reservedUnits,
        incomingUnits: item.incomingUnits,
        incomingEta: item.incomingEta,
        sellThroughLastHour: item.sellThroughLastHour,
        pageViewsLastHour: item.pageViewsLastHour,
        conversionRateLastHour: item.conversionRateLastHour,
        activeCampaignIds,
        score: round(score),
        severity,
        confidence: confidenceFromFlags(item.dataQualityFlags),
        reasons: reasons.length > 0 ? reasons : ["SKU estable, sin presion critica actual"],
        evidence: [
          buildEvidence("stock", "available_units", item.availableUnits, stockScarcity),
          buildEvidence("inventory", "reserved_units", item.reservedUnits, reservedPressure),
          buildEvidence("demand", "expected_hourly_demand", round(expectedDemand, 2), demandPressure),
          buildEvidence("campaign", "active_campaigns", activeCampaignIds.length, maxCampaignIntensity),
        ],
      };
    })
    .sort((left, right) => right.score - left.score);
}

function scoreFromShippingStatus(status: ShippingStatus) {
  switch (status) {
    case "lost":
      return 1;
    case "returned_to_sender":
      return 0.97;
    case "exception":
      return 0.93;
    case "delayed":
      return 0.88;
    case "label_created":
      return 0.52;
    case "at_sorting_center":
      return 0.34;
    case "in_transit":
      return 0.24;
    case "picked_up":
      return 0.2;
    case "out_for_delivery":
      return 0.08;
    case "delivered":
      return 0.02;
    default:
      return 0.18;
  }
}

function formatShippingDelayReason(
  reason: ShippingStatusSnapshot["delayReason"],
) {
  return reason ? reason.replace(/_/g, " ") : null;
}

function selectRelevantOrdersForShipping(orderRisks: OrderRisk[]) {
  const { relevantOrderLimit } = getShippingStatusApiConfig();
  const limit = Number.isFinite(relevantOrderLimit)
    ? Math.max(6, relevantOrderLimit)
    : 18;

  return orderRisks
    .map((risk) => {
      const severityBoost =
        risk.severity === "critical"
          ? 0.18
          : risk.severity === "high"
            ? 0.1
            : 0.04;
      const expressBoost = risk.shippingMethod === "express" ? 0.16 : 0.04;
      const ticketBoost = Math.min(risk.linkedTicketIds.length * 0.08, 0.16);
      const vipBoost = risk.isVip ? 0.12 : 0;
      const statusBoost =
        risk.status === "payment_review"
          ? 0.16
          : risk.status === "processing"
            ? 0.08
            : 0;

      return {
        orderId: risk.orderId,
        score:
          risk.score +
          severityBoost +
          expressBoost +
          ticketBoost +
          vipBoost +
          statusBoost,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.orderId);
}

function buildOrderRisks(
  dataset: NormalizedDataset,
  customersById: Map<string, NormalizedCustomer>,
  inventoryPressureBySku: Map<string, InventoryPressure>,
  ticketsByOrderId: Map<string, NormalizedSupportTicket[]>,
  campaignsBySku: Map<string, NormalizedCampaign[]>,
  shippingByOrderId: Map<string, ShippingStatusSnapshot>,
) {
  return dataset.orders
    .map<OrderRisk>((order) => {
      const customer = customersById.get(order.customerId);
      const linkedTickets = ticketsByOrderId.get(order.id) ?? [];
      const inventoryRisk = inventoryPressureBySku.get(order.sku);
      const campaignCollisions = campaignsBySku.get(order.sku) ?? [];
      const shippingStatus = shippingByOrderId.get(order.id) ?? null;

      const statusScore =
        {
          payment_review: 1,
          processing: 0.6,
          paid: 0.28,
          packed: 0.12,
          unknown: 0.4,
        }[order.status] ?? 0.35;
      const shippingMethodScore =
        order.shippingMethod === "express"
          ? 0.85
          : order.shippingMethod === "pickup_point"
            ? 0.35
            : 0.2;
      const shippingStatusScore = shippingStatus
        ? scoreFromShippingStatus(shippingStatus.shippingStatus)
        : 0.18;
      const shippingDelayScore = shippingStatus
        ? clamp(
            shippingStatus.delayRisk +
              (shippingStatus.requiresManualReview ? 0.24 : 0) +
              Math.min(shippingStatus.deliveryAttempts * 0.12, 0.24),
            0,
            1,
          )
        : 0.12;
      const shippingSignalScore = shippingStatus
        ? clamp(Math.max(shippingStatusScore, shippingDelayScore), 0, 1)
        : order.shippingMethod === "express"
          ? 0.42
          : 0.16;
      const ticketScore = Math.max(
        0,
        ...linkedTickets.map((ticket) => scoreFromUrgency(ticket.urgency)),
      );
      const customerValueScore = customer
        ? clamp((customer.isVip ? 0.45 : 0) + customer.lifetimeValue / 600, 0, 1)
        : 0.18;
      const dataQualityScore = clamp(order.dataQualityFlags.length * 0.4, 0, 1);
      const campaignScore = Math.max(
        0,
        ...campaignCollisions.map((campaign) => scoreFromCampaignIntensity(campaign.intensity)),
      );

      let score = clamp(
        0.18 * statusScore +
          0.1 * shippingMethodScore +
          0.22 * shippingSignalScore +
          0.16 * ticketScore +
          0.17 * (inventoryRisk?.score ?? 0.18) +
          0.1 * customerValueScore +
          0.04 * dataQualityScore +
          0.03 * campaignScore,
        0,
        1,
      );

      if (shippingStatus?.shippingStatus === "lost") {
        score = Math.max(score, 0.97);
      } else if (
        shippingStatus?.shippingStatus === "returned_to_sender" ||
        shippingStatus?.shippingStatus === "exception"
      ) {
        score = Math.max(score, 0.92);
      } else if (shippingStatus?.shippingStatus === "delayed") {
        score = Math.max(score, 0.86);
      } else if (shippingStatus?.requiresManualReview) {
        score = Math.max(score, 0.82);
      } else if ((shippingStatus?.delayRisk ?? 0) >= 0.7) {
        score = Math.max(score, 0.78);
      }

      if (
        shippingStatus?.shippingStatus === "delivered" &&
        linkedTickets.length === 0 &&
        order.status !== "payment_review"
      ) {
        score = Math.min(score, 0.38);
      }

      const severity = severityFromScore(score);
      const reasons: string[] = [];

      if (shippingStatus?.requiresManualReview) {
        reasons.push("La Shipping Status API exige revision manual del pedido");
      }
      if (shippingStatus?.shippingStatus === "lost") {
        reasons.push("La Shipping Status API marca el envio como perdido");
      }
      if (shippingStatus?.shippingStatus === "returned_to_sender") {
        reasons.push("La Shipping Status API indica devolucion al remitente");
      }
      if (shippingStatus?.shippingStatus === "exception") {
        reasons.push("La Shipping Status API detecta una incidencia logistica");
      }
      if (shippingStatus?.shippingStatus === "delayed") {
        reasons.push("La Shipping Status API confirma un retraso en curso");
      }
      if ((shippingStatus?.delayRisk ?? 0) >= 0.45) {
        reasons.push(
          `La Shipping Status API estima un ${Math.round((shippingStatus?.delayRisk ?? 0) * 100)}% de riesgo de retraso`,
        );
      }
      if (shippingStatus?.deliveryAttempts && shippingStatus.shippingStatus !== "delivered") {
        reasons.push(
          `Ya hubo ${shippingStatus.deliveryAttempts} intento(s) de entrega`,
        );
      }
      if (shippingStatus?.delayReason) {
        reasons.push(
          `Motivo logistico: ${formatShippingDelayReason(shippingStatus.delayReason)}`,
        );
      }
      if (order.status === "payment_review") {
        reasons.push("Pedido bloqueado en payment review");
      }
      if (order.shippingMethod === "express") {
        reasons.push("Entrega express con poco margen de error");
      }
      if (linkedTickets.length > 0) {
        reasons.push(`Cliente ya ha abierto ${linkedTickets.length} ticket(s)`);
      }
      if (
        (inventoryRisk?.severity === "critical" || inventoryRisk?.severity === "high") &&
        inventoryRisk
      ) {
        reasons.push(`El SKU ${order.sku} esta bajo tension operativa`);
      }
      if (customer?.isVip) {
        reasons.push("Cliente VIP impactado");
      }
      if (order.dataQualityFlags.length > 0) {
        reasons.push("Datos del pedido incompletos o ambiguos");
      }
      if (shippingStatus?.shippingStatus === "delivered" && reasons.length === 0) {
        reasons.push("La Shipping Status API confirma la entrega del pedido");
      }

      return {
        orderId: order.id,
        customerId: order.customerId,
        sku: order.sku,
        productName: order.productName,
        status: order.status,
        shippingMethod: order.shippingMethod,
        orderValue: order.orderValue,
        customerSegment: order.customerSegment,
        isVip: customer?.isVip ?? false,
        linkedTicketIds: linkedTickets.map((ticket) => ticket.id),
        shippingStatus,
        score: round(score),
        severity,
        confidence: confidenceFromFlags(
          order.dataQualityFlags,
          (customer ? 0.02 : 0) + (shippingStatus ? 0.03 : 0),
        ),
        reasons: reasons.length > 0 ? reasons : ["Pedido sin riesgo operativo alto"],
        evidence: [
          buildEvidence("order", "order_status", order.status, statusScore),
          buildEvidence(
            "shipping",
            "shipping_method",
            order.shippingMethod,
            shippingMethodScore,
          ),
          buildEvidence(
            "shipping_api",
            "shipping_status",
            shippingStatus?.shippingStatus ?? "not_queried",
            shippingStatus ? shippingStatusScore : 0,
          ),
          buildEvidence(
            "shipping_api",
            "delay_risk",
            shippingStatus ? round(shippingStatus.delayRisk, 3) : null,
            shippingStatus ? shippingDelayScore : 0,
          ),
          buildEvidence("support", "linked_tickets", linkedTickets.length, ticketScore),
          buildEvidence(
            "inventory",
            "inventory_risk",
            inventoryRisk?.score ?? 0,
            inventoryRisk?.score ?? 0,
          ),
        ],
      };
    })
    .sort((left, right) => right.score - left.score);
}
function buildTicketPriority(
  dataset: NormalizedDataset,
  customersById: Map<string, NormalizedCustomer>,
  ordersById: Map<string, NormalizedOrder>,
  orderRiskById: Map<string, OrderRisk>,
) {
  return dataset.tickets
    .map<TicketPriority>((ticket) => {
      const customer = ticket.customerId ? customersById.get(ticket.customerId) : undefined;
      const order = ticket.orderId ? ordersById.get(ticket.orderId) : undefined;
      const orderRisk = ticket.orderId ? orderRiskById.get(ticket.orderId) : undefined;

      const urgencyScore = scoreFromUrgency(ticket.urgency);
      const sentimentScore = scoreFromSentiment(ticket.sentiment);
      const customerValueScore = customer
        ? clamp((customer.isVip ? 0.4 : 0) + customer.lifetimeValue / 650, 0, 1)
        : 0.15;
      const shippingScore = order?.shippingMethod === "express" ? 0.9 : 0.25;
      const score = clamp(
        0.36 * urgencyScore +
          0.18 * sentimentScore +
          0.2 * (orderRisk?.score ?? 0.16) +
          0.14 * customerValueScore +
          0.12 * shippingScore,
        0,
        1,
      );
      const severity = severityFromScore(score);
      const reasons: string[] = [];

      if (ticket.urgency === "urgent" || ticket.urgency === "high") {
        reasons.push(`Ticket ${ticket.urgency} abierto en soporte`);
      }
      if (ticket.sentiment === "negative") {
        reasons.push("Sentimiento negativo detectado");
      }
      if (customer?.isVip) {
        reasons.push("Afecta a cliente VIP");
      }
      if (order?.shippingMethod === "express") {
        reasons.push("Relacionado con un pedido express");
      }

      return {
        ticketId: ticket.id,
        orderId: ticket.orderId,
        customerId: ticket.customerId,
        urgency: ticket.urgency,
        sentiment: ticket.sentiment,
        channel: ticket.channel,
        message: ticket.message,
        score: round(score),
        severity,
        confidence: round(0.92, 3),
        reasons: reasons.length > 0 ? reasons : ["Ticket sin escalado inmediato"],
        evidence: [
          buildEvidence("support", "urgency", ticket.urgency, urgencyScore),
          buildEvidence("support", "sentiment", ticket.sentiment, sentimentScore),
          buildEvidence("order", "order_risk", orderRisk?.score ?? 0, orderRisk?.score ?? 0),
          buildEvidence("shipping", "shipping_method", order?.shippingMethod ?? null, shippingScore),
        ],
      };
    })
    .sort((left, right) => right.score - left.score);
}

function buildCampaignRisks(
  dataset: NormalizedDataset,
  inventoryPressureBySku: Map<string, InventoryPressure>,
) {
  return dataset.campaigns
    .map<CampaignRisk>((campaign) => {
      const inventoryRisk = campaign.targetSku
        ? inventoryPressureBySku.get(campaign.targetSku)
        : undefined;
      const intensityScore = scoreFromCampaignIntensity(campaign.intensity);
      const activeModifier =
        campaign.status === "active" ? 1 : campaign.status === "monitoring" ? 0.7 : 0.3;
      const score = clamp(
        0.34 * intensityScore +
          0.3 * (inventoryRisk?.score ?? 0.16) +
          0.18 * clamp(campaign.trafficGrowth / 4, 0, 1) +
          0.12 * clamp(campaign.conversionRate / 0.09, 0, 1) +
          0.06 * activeModifier,
        0,
        1,
      );
      const severity = severityFromScore(score);
      const reasons: string[] = [];

      if (campaign.status === "active") {
        reasons.push("Campana activa empujando demanda ahora mismo");
      }
      if (campaign.intensity === "very_high" || campaign.intensity === "high") {
        reasons.push(`Intensidad ${campaign.intensity}`);
      }
      if ((inventoryRisk?.severity === "critical" || inventoryRisk?.severity === "high") && campaign.targetSku) {
        reasons.push(`El SKU ${campaign.targetSku} ya esta tensionado`);
      }

      return {
        campaignId: campaign.id,
        source: campaign.source,
        status: campaign.status,
        targetSku: campaign.targetSku,
        targetCity: campaign.targetCity,
        intensity: campaign.intensity,
        budgetSpent: campaign.budgetSpent,
        trafficGrowth: campaign.trafficGrowth,
        conversionRate: campaign.conversionRate,
        score: round(score),
        severity,
        confidence: round(0.95, 3),
        reasons: reasons.length > 0 ? reasons : ["Campana bajo control"],
        evidence: [
          buildEvidence("campaign", "intensity", campaign.intensity, intensityScore),
          buildEvidence("campaign", "traffic_growth", campaign.trafficGrowth, clamp(campaign.trafficGrowth / 4, 0, 1)),
          buildEvidence("inventory", "target_sku_risk", inventoryRisk?.score ?? 0, inventoryRisk?.score ?? 0),
          buildEvidence("campaign", "conversion_rate", campaign.conversionRate, clamp(campaign.conversionRate / 0.09, 0, 1)),
        ],
      };
    })
    .sort((left, right) => right.score - left.score);
}

function buildActionBase(
  snapshotId: string,
  input: Omit<ActionItem, "id" | "rank" | "createdAt" | "snapshotId" | "status">,
) {
  const id = makeActionId(snapshotId, `${input.actionType}:${input.targetId}`);

  return {
    ...input,
    id,
    snapshotId,
    rank: 0,
    createdAt: new Date().toISOString(),
    status: "new" as const,
  } satisfies ActionItem;
}

function synthesizeActions(
  snapshotId: string,
  dataset: NormalizedDataset,
  orderRisks: OrderRisk[],
  inventoryPressure: InventoryPressure[],
  ticketPriority: TicketPriority[],
  campaignRisks: CampaignRisk[],
  customersById: Map<string, NormalizedCustomer>,
) {
  const candidates: ActionItem[] = [];

  for (const risk of campaignRisks.slice(0, 6)) {
    if (risk.score < 0.58 || risk.status !== "active") {
      continue;
    }

    const shouldPause = risk.score >= 0.86 || risk.severity === "critical";
    candidates.push(
      buildActionBase(snapshotId, {
        actionType: shouldPause ? "pause_campaign" : "limit_campaign",
        severity: risk.severity,
        targetType: "campaign",
        targetId: risk.campaignId,
        title: `${shouldPause ? "Pausar" : "Limitar"} ${risk.campaignId}${risk.targetSku ? ` sobre ${risk.targetSku}` : ""}`,
        reason: `${risk.reasons[0]}. ${risk.targetSku ? `El SKU ${risk.targetSku} concentra la presion mas inmediata.` : "La demanda generada amenaza la operativa del lanzamiento."}`,
        expectedImpact:
          "Reducir la presion comercial sobre inventario limitado y evitar una cascada de pedidos conflictivos.",
        confidence: risk.confidence,
        owner: "growth",
        automationPossible: true,
        score: risk.score,
        evidence: risk.evidence.slice(0, 4),
        relatedEntityIds: dedupe([risk.campaignId, risk.targetSku ?? ""]).filter(Boolean),
      }),
    );
  }

  for (const pressure of inventoryPressure.slice(0, 6)) {
    if (pressure.score < 0.62) {
      continue;
    }

    candidates.push(
      buildActionBase(snapshotId, {
        actionType: "alert_stock",
        severity: pressure.severity,
        targetType: "sku",
        targetId: pressure.sku,
        title: `Proteger stock de ${pressure.sku}`,
        reason: `${pressure.reasons[0]}. ${pressure.activeCampaignIds.length > 0 ? "Hay campanas activas amplificando el riesgo." : "La rotura puede ocurrir durante el pico del lanzamiento."}`,
        expectedImpact:
          "Evitar overselling, incidencias logisticas y promesas de entrega dificiles de cumplir.",
        confidence: pressure.confidence,
        owner: "inventory",
        automationPossible: true,
        score: pressure.score,
        evidence: pressure.evidence.slice(0, 4),
        relatedEntityIds: dedupe([pressure.sku, ...pressure.activeCampaignIds]),
      }),
    );
  }

  for (const ticket of ticketPriority.slice(0, 5)) {
    if (ticket.score < 0.64) {
      continue;
    }

    candidates.push(
      buildActionBase(snapshotId, {
        actionType: "escalate_ticket",
        severity: ticket.severity,
        targetType: "ticket",
        targetId: ticket.ticketId,
        title: `Escalar ticket ${ticket.ticketId}`,
        reason: `${ticket.reasons[0]}. ${ticket.orderId ? `Esta ligado al pedido ${ticket.orderId}.` : "Riesgo directo sobre experiencia de cliente."}`,
        expectedImpact:
          "Reducir friccion de soporte, contener mala experiencia y evitar escalado publico del problema.",
        confidence: ticket.confidence,
        owner: "support",
        automationPossible: false,
        score: ticket.score,
        evidence: ticket.evidence.slice(0, 4),
        relatedEntityIds: dedupe([ticket.ticketId, ticket.orderId ?? "", ticket.customerId ?? ""]).filter(Boolean),
      }),
    );
  }

  for (const risk of orderRisks.slice(0, 8)) {
    if (risk.score < 0.62) {
      continue;
    }

    const shippingBlocker =
      risk.shippingStatus &&
      (risk.shippingStatus.requiresManualReview ||
        ["delayed", "exception", "lost", "returned_to_sender"].includes(
          risk.shippingStatus.shippingStatus,
        ) ||
        risk.shippingStatus.delayRisk >= 0.58);
    const actionType =
      shippingBlocker ||
      risk.status === "payment_review" ||
      risk.reasons.some((reason) => reason.includes("incompletos"))
        ? "manual_review"
        : "prioritize_order";

    candidates.push(
      buildActionBase(snapshotId, {
        actionType,
        severity: risk.severity,
        targetType: "order",
        targetId: risk.orderId,
        title: shippingBlocker
          ? `Resolver bloqueo logistico ${risk.orderId}`
          : actionType === "manual_review"
            ? `Revisar manualmente ${risk.orderId}`
            : `Priorizar pedido ${risk.orderId}`,
        reason: `${risk.reasons[0]}. ${shippingBlocker ? "La Shipping Status API cambia la prioridad de este pedido." : risk.linkedTicketIds.length > 0 ? "El cliente ya esta mostrando friccion en soporte." : "Conviene actuar antes de que la experiencia empeore."}`,
        expectedImpact: shippingBlocker
          ? "Resolver incidencias logisticas reales antes de incumplir entrega o perder el pedido."
          : "Reducir retrasos, evitar incidencias y proteger pedidos con mayor sensibilidad operativa.",
        confidence: risk.confidence,
        owner: "operations",
        automationPossible: actionType === "prioritize_order",
        score: risk.score,
        evidence: risk.evidence.slice(0, 5),
        relatedEntityIds: dedupe([risk.orderId, risk.customerId, risk.sku, ...risk.linkedTicketIds]),
      }),
    );

    const customer = customersById.get(risk.customerId);
    const shouldContact =
      (risk.isVip || (customer?.lifetimeValue ?? 0) >= 250) &&
      (risk.linkedTicketIds.length > 0 || risk.severity === "critical" || Boolean(shippingBlocker));

    if (shouldContact) {
      candidates.push(
        buildActionBase(snapshotId, {
          actionType: "contact_customer",
          severity: risk.severity,
          targetType: "customer",
          targetId: risk.customerId,
          title: `Contactar proactivamente a ${risk.customerId}`,
          reason: `Cliente de alto valor afectado por ${risk.orderId}. ${risk.reasons[0]}.`,
          expectedImpact:
            "Bajar tension antes de que el cliente pierda confianza o abra una nueva incidencia.",
          confidence: clamp(risk.confidence - 0.03, 0.35, 0.99),
          owner: "support",
          automationPossible: true,
          score: clamp(risk.score - 0.03, 0, 1),
          evidence: risk.evidence.slice(0, 4),
          relatedEntityIds: dedupe([risk.customerId, risk.orderId, ...risk.linkedTicketIds]),
        }),
      );
    }
  }

  const byKey = new Map<string, ActionItem>();
  for (const candidate of candidates) {
    const key = `${candidate.actionType}:${candidate.targetId}`;
    const existing = byKey.get(key);

    if (!existing || candidate.score > existing.score) {
      byKey.set(key, candidate);
    }
  }

  return Array.from(byKey.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, 10)
    .map((action, index) => ({
      ...action,
      rank: index + 1,
    }));
}
function buildNotifications(topActions: ActionItem[], warnings: string[]) {
  const notifications: NotificationItem[] = topActions
    .filter(
      (action) =>
        action.severity === "critical" ||
        action.rank <= 3 ||
        action.actionType === "escalate_ticket",
    )
    .map((action) => ({
      id: `notif-${action.id}`,
      category: action.actionType,
      severity: action.severity,
      title: action.title,
      message: `${action.reason} Owner sugerido: ${action.owner}.`,
      targetId: action.targetId,
      relatedActionId: action.id,
      shouldNotifyTelegram:
        action.severity === "critical" || action.actionType === "escalate_ticket",
      deliveryStatus:
        action.severity === "critical" || action.actionType === "escalate_ticket"
          ? "pending"
          : "skipped",
      createdAt: action.createdAt,
    }));

  if (warnings.length > 0) {
    notifications.unshift({
      id: `notif-data-quality-${warnings.length}`,
      category: "data_quality",
      severity: "medium",
      title: "Calidad de dato imperfecta",
      message: `El dataset trae ${warnings.length} warning(s) de parseo o esquema. El snapshot sigue siendo usable, pero conviene revisarlos.`,
      targetId: "dataset",
      relatedActionId: null,
      shouldNotifyTelegram: false,
      deliveryStatus: "skipped",
      createdAt: new Date().toISOString(),
    });
  }

  return notifications;
}

export async function buildComputedSnapshot(datasetFingerprint: string): Promise<ComputedSnapshot> {
  const dataset = await loadNormalizedDataset();
  const createdAt = new Date().toISOString();
  const snapshotId = createHash("sha1")
    .update(`${datasetFingerprint}:${createdAt}`)
    .digest("hex")
    .slice(0, 16);
  const customersById = new Map(dataset.customers.map((customer) => [customer.id, customer]));
  const ordersById = new Map(dataset.orders.map((order) => [order.id, order]));
  const ticketsByOrderId = new Map<string, NormalizedSupportTicket[]>();
  const campaignsBySku = new Map<string, NormalizedCampaign[]>();

  for (const ticket of dataset.tickets) {
    if (!ticket.orderId) {
      continue;
    }
    const current = ticketsByOrderId.get(ticket.orderId) ?? [];
    current.push(ticket);
    ticketsByOrderId.set(ticket.orderId, current);
  }

  for (const campaign of dataset.campaigns) {
    if (!campaign.targetSku) {
      continue;
    }
    const current = campaignsBySku.get(campaign.targetSku) ?? [];
    current.push(campaign);
    campaignsBySku.set(campaign.targetSku, current);
  }

  const inventoryPressure = buildInventoryPressure(dataset, campaignsBySku);
  const inventoryPressureBySku = new Map(
    inventoryPressure.map((item) => [item.sku, item]),
  );
  const preliminaryOrderRisks = buildOrderRisks(
    dataset,
    customersById,
    inventoryPressureBySku,
    ticketsByOrderId,
    campaignsBySku,
    new Map<string, ShippingStatusSnapshot>(),
  );
  const relevantOrderIds = selectRelevantOrdersForShipping(preliminaryOrderRisks);
  const shippingLookup = await fetchRelevantShippingStatuses(relevantOrderIds);
  const warnings = [...dataset.warnings, ...shippingLookup.warnings];
  const orderRisks = buildOrderRisks(
    dataset,
    customersById,
    inventoryPressureBySku,
    ticketsByOrderId,
    campaignsBySku,
    shippingLookup.recordsByOrderId,
  );
  const orderRiskById = new Map(orderRisks.map((risk) => [risk.orderId, risk]));
  const ticketPriority = buildTicketPriority(
    dataset,
    customersById,
    ordersById,
    orderRiskById,
  );
  const campaignRisks = buildCampaignRisks(dataset, inventoryPressureBySku);
  const topActions = synthesizeActions(
    snapshotId,
    dataset,
    orderRisks,
    inventoryPressure,
    ticketPriority,
    campaignRisks,
    customersById,
  );
  const notifications = buildNotifications(topActions, warnings);
  const metrics = buildMetrics(
    dataset,
    orderRisks,
    inventoryPressure,
    ticketPriority,
    topActions,
  );
  const launch = buildLaunchSnapshot(dataset, createdAt);

  return {
    snapshotId,
    datasetFingerprint,
    datasetPath: getDatasetDirectory(),
    createdAt,
    launch,
    warnings,
    summary: makeSummary(metrics, topActions, campaignRisks, orderRisks),
    metrics,
    orderRisks,
    inventoryPressure,
    ticketPriority,
    campaignRisks,
    topActions,
    notifications,
    persistence: {
      mode: "local_json",
      persisted: false,
      persistedAt: null,
      storeDir: "",
    },
  };
}
