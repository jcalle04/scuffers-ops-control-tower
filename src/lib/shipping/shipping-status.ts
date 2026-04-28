import { getShippingStatusApiConfig } from "@/lib/config/app-config";
import {
  clamp,
  parseBoolean,
  parseInteger,
  parseIsoDate,
  parseNumber,
  safeString,
} from "@/lib/utils/parsers";
import type {
  ShippingDelayReason,
  ShippingStatus,
  ShippingStatusSnapshot,
} from "@/types/domain";

interface ShippingStatusFetchResult {
  recordsByOrderId: Map<string, ShippingStatusSnapshot>;
  warnings: string[];
}

function normalizeShippingStatus(value: unknown): ShippingStatus {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "label_created":
    case "picked_up":
    case "in_transit":
    case "at_sorting_center":
    case "out_for_delivery":
    case "delivered":
    case "delayed":
    case "exception":
    case "lost":
    case "returned_to_sender":
      return raw;
    default:
      return "unknown";
  }
}

function normalizeDelayReason(value: unknown): ShippingDelayReason | null {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "high_volume":
    case "carrier_capacity_issue":
    case "address_validation_error":
    case "weather_disruption":
    case "warehouse_delay":
    case "customs_hold":
    case "unknown":
      return raw;
    default:
      return null;
  }
}

function normalizeShippingPayload(
  requestedOrderId: string,
  payload: unknown,
): ShippingStatusSnapshot {
  const record = payload && typeof payload === "object" ? payload : {};
  const resolvedOrderId =
    safeString((record as { order_id?: string }).order_id) ?? requestedOrderId;

  return {
    orderId: resolvedOrderId,
    shippingStatus: normalizeShippingStatus(
      (record as { shipping_status?: string }).shipping_status,
    ),
    estimatedDeliveryDate: parseIsoDate(
      (record as { estimated_delivery_date?: string }).estimated_delivery_date,
    ),
    delayRisk: clamp(
      parseNumber((record as { delay_risk?: string | number }).delay_risk),
      0,
      1,
    ),
    delayReason: normalizeDelayReason(
      (record as { delay_reason?: string | null }).delay_reason,
    ),
    deliveryAttempts: parseInteger(
      (record as { delivery_attempts?: string | number }).delivery_attempts,
    ),
    requiresManualReview: parseBoolean(
      (record as { requires_manual_review?: boolean | string }).requires_manual_review,
    ),
    fetchedAt: new Date().toISOString(),
    source: "shipping_status_api",
  };
}

async function fetchShippingStatus(orderId: string) {
  const config = getShippingStatusApiConfig();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/${encodeURIComponent(orderId)}`, {
      headers: {
        "X-Candidate-Id": config.candidateId,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    return normalizeShippingPayload(orderId, payload);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRelevantShippingStatuses(
  orderIds: string[],
): Promise<ShippingStatusFetchResult> {
  const uniqueOrderIds = Array.from(
    new Set(orderIds.map((orderId) => orderId.trim()).filter(Boolean)),
  );
  const recordsByOrderId = new Map<string, ShippingStatusSnapshot>();
  const warnings: string[] = [];

  const results = await Promise.allSettled(
    uniqueOrderIds.map(async (orderId) => {
      const shippingStatus = await fetchShippingStatus(orderId);
      return { orderId, shippingStatus };
    }),
  );

  results.forEach((result, index) => {
    const orderId = uniqueOrderIds[index];

    if (result.status === "fulfilled") {
      recordsByOrderId.set(orderId, result.value.shippingStatus);
      return;
    }

    warnings.push(
      `shipping-status API no disponible para ${orderId}: ${
        result.reason instanceof Error ? result.reason.message : "error desconocido"
      }`,
    );
  });

  return {
    recordsByOrderId,
    warnings,
  };
}
