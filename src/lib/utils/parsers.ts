import type {
  CampaignIntensity,
  CampaignStatus,
  CustomerSegment,
  OrderStatus,
  RiskSeverity,
  SupportSentiment,
  SupportUrgency,
} from "@/types/domain";

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function safeString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseInteger(value: unknown, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseNumber(value: unknown, fallback = 0) {
  const raw = safeString(value);

  if (!raw) {
    return fallback;
  }

  const normalized = raw
    .replace(/€/g, "")
    .replace(/eur/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, ".")
    .replace(/,(\d{1,2})$/, ".$1")
    .replace(/,/g, "");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseMoney(value: unknown) {
  const raw = safeString(value);
  if (!raw) {
    return null;
  }

  const parsed = parseNumber(raw, Number.NaN);
  return Number.isFinite(parsed) ? round(parsed, 2) : null;
}

export function parseBoolean(value: unknown) {
  const raw = safeString(value)?.toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes" || raw === "si";
}

export function parseIsoDate(value: unknown) {
  const raw = safeString(value);

  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "paid":
    case "processing":
    case "packed":
    case "payment_review":
      return raw;
    default:
      return "unknown";
  }
}

export function normalizeCustomerSegment(value: unknown): CustomerSegment {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "new_customer":
    case "repeat_customer":
    case "loyal_customer":
    case "at_risk_customer":
    case "vip_customer":
      return raw;
    default:
      return "unknown";
  }
}

export function normalizeSupportUrgency(value: unknown): SupportUrgency {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "urgent":
    case "high":
    case "medium":
    case "low":
      return raw;
    default:
      return "unknown";
  }
}

export function normalizeSupportSentiment(value: unknown): SupportSentiment {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "negative":
    case "neutral":
    case "positive":
      return raw;
    default:
      return "unknown";
  }
}

export function normalizeCampaignStatus(value: unknown): CampaignStatus {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "active":
    case "monitoring":
    case "paused":
      return raw;
    default:
      return "unknown";
  }
}

export function normalizeCampaignIntensity(value: unknown): CampaignIntensity {
  const raw = safeString(value)?.toLowerCase();

  switch (raw) {
    case "very_high":
    case "high":
    case "medium":
    case "low":
      return raw;
    default:
      return "unknown";
  }
}

export function severityFromScore(score: number): RiskSeverity {
  if (score >= 0.85) {
    return "critical";
  }
  if (score >= 0.68) {
    return "high";
  }
  if (score >= 0.42) {
    return "medium";
  }
  return "info";
}

export function scoreFromUrgency(urgency: SupportUrgency) {
  switch (urgency) {
    case "urgent":
      return 1;
    case "high":
      return 0.78;
    case "medium":
      return 0.48;
    case "low":
      return 0.22;
    default:
      return 0.12;
  }
}

export function scoreFromSentiment(sentiment: SupportSentiment) {
  switch (sentiment) {
    case "negative":
      return 0.9;
    case "neutral":
      return 0.45;
    case "positive":
      return 0.1;
    default:
      return 0.2;
  }
}

export function scoreFromCampaignIntensity(intensity: CampaignIntensity) {
  switch (intensity) {
    case "very_high":
      return 1;
    case "high":
      return 0.75;
    case "medium":
      return 0.45;
    case "low":
      return 0.2;
    default:
      return 0.15;
  }
}

export function confidenceFromFlags(flags: string[], bonus = 0) {
  return clamp(round(0.96 - flags.length * 0.08 + bonus, 3), 0.35, 0.99);
}
