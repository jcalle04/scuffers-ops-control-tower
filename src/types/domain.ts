export type OrderStatus =
  | "paid"
  | "processing"
  | "packed"
  | "payment_review"
  | "unknown";

export type CustomerSegment =
  | "new_customer"
  | "repeat_customer"
  | "loyal_customer"
  | "at_risk_customer"
  | "vip_customer"
  | "unknown";

export type SupportUrgency = "urgent" | "high" | "medium" | "low" | "unknown";
export type SupportSentiment = "negative" | "neutral" | "positive" | "unknown";
export type CampaignStatus = "active" | "monitoring" | "paused" | "unknown";
export type CampaignIntensity = "very_high" | "high" | "medium" | "low" | "unknown";
export type RiskSeverity = "critical" | "high" | "medium" | "info";
export type ActionType =
  | "prioritize_order"
  | "contact_customer"
  | "pause_campaign"
  | "limit_campaign"
  | "alert_stock"
  | "escalate_ticket"
  | "manual_review";
export type ActionOwner = "operations" | "support" | "inventory" | "growth";
export type ShippingStatus =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "at_sorting_center"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "exception"
  | "lost"
  | "returned_to_sender"
  | "unknown";
export type ShippingDelayReason =
  | "high_volume"
  | "carrier_capacity_issue"
  | "address_validation_error"
  | "weather_disruption"
  | "warehouse_delay"
  | "customs_hold"
  | "unknown";

export interface RawOrderRow {
  order_id?: string;
  customer_id?: string;
  created_at?: string;
  order_status?: string;
  sku?: string;
  quantity?: string;
  order_value?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_method?: string;
  customer_segment?: string;
  campaign_source?: string;
}

export interface RawOrderItemRow {
  order_id?: string;
  sku?: string;
  product_name?: string;
  category?: string;
  size?: string;
  quantity?: string;
  unit_price?: string;
}

export interface RawCustomerRow {
  customer_id?: string;
  customer_segment?: string;
  customer_lifetime_value?: string;
  customer_orders_count?: string;
  customer_returns_count?: string;
  is_vip?: string;
  preferred_city?: string;
  email_opt_in?: string;
}

export interface RawInventoryRow {
  sku?: string;
  product_name?: string;
  category?: string;
  size?: string;
  unit_price?: string;
  warehouse_stock?: string;
  inventory_available_units?: string;
  inventory_reserved_units?: string;
  inventory_incoming_units?: string;
  inventory_incoming_eta?: string;
  sell_through_rate_last_hour?: string;
  product_page_views_last_hour?: string;
  conversion_rate_last_hour?: string;
}

export interface RawSupportTicketRow {
  ticket_id?: string;
  order_id?: string;
  customer_id?: string;
  created_at?: string;
  channel?: string;
  support_ticket_message?: string;
  support_ticket_urgency?: string;
  support_ticket_sentiment?: string;
}

export interface RawCampaignRow {
  campaign_id?: string;
  campaign_source?: string;
  status?: string;
  target_sku?: string;
  target_city?: string;
  campaign_intensity?: string;
  budget_spent?: string;
  traffic_growth?: string;
  conversion_rate?: string;
  started_at?: string;
}

export interface NormalizedOrder {
  id: string;
  customerId: string;
  createdAt: string | null;
  status: OrderStatus;
  sku: string;
  quantity: number;
  orderValue: number | null;
  shippingCity: string | null;
  shippingCountry: string | null;
  shippingMethod: string | null;
  customerSegment: CustomerSegment;
  campaignSource: string | null;
  productName: string | null;
  category: string | null;
  size: string | null;
  dataQualityFlags: string[];
}

export interface NormalizedCustomer {
  id: string;
  segment: CustomerSegment;
  lifetimeValue: number;
  ordersCount: number;
  returnsCount: number;
  isVip: boolean;
  preferredCity: string | null;
  emailOptIn: boolean;
}

export interface NormalizedInventoryItem {
  sku: string;
  productName: string | null;
  category: string | null;
  size: string | null;
  unitPrice: number | null;
  warehouseStock: number;
  availableUnits: number;
  reservedUnits: number;
  incomingUnits: number;
  incomingEta: string | null;
  sellThroughLastHour: number;
  pageViewsLastHour: number;
  conversionRateLastHour: number;
  dataQualityFlags: string[];
}

export interface NormalizedSupportTicket {
  id: string;
  orderId: string | null;
  customerId: string | null;
  createdAt: string | null;
  channel: string | null;
  message: string | null;
  urgency: SupportUrgency;
  sentiment: SupportSentiment;
}

export interface NormalizedCampaign {
  id: string;
  source: string | null;
  status: CampaignStatus;
  targetSku: string | null;
  targetCity: string | null;
  intensity: CampaignIntensity;
  budgetSpent: number;
  trafficGrowth: number;
  conversionRate: number;
  startedAt: string | null;
}

export interface EvidenceItem {
  type: string;
  label: string;
  value: string | number | boolean | null;
  weight: number;
}

export interface ShippingStatusSnapshot {
  orderId: string;
  shippingStatus: ShippingStatus;
  estimatedDeliveryDate: string | null;
  delayRisk: number;
  delayReason: ShippingDelayReason | null;
  deliveryAttempts: number;
  requiresManualReview: boolean;
  fetchedAt: string;
  source: "shipping_status_api";
}

export interface OrderRisk {
  orderId: string;
  customerId: string;
  sku: string;
  productName: string | null;
  status: OrderStatus;
  shippingMethod: string | null;
  orderValue: number | null;
  customerSegment: CustomerSegment;
  isVip: boolean;
  linkedTicketIds: string[];
  shippingStatus: ShippingStatusSnapshot | null;
  score: number;
  severity: RiskSeverity;
  confidence: number;
  reasons: string[];
  evidence: EvidenceItem[];
}

export interface InventoryPressure {
  sku: string;
  productName: string | null;
  category: string | null;
  availableUnits: number;
  reservedUnits: number;
  incomingUnits: number;
  incomingEta: string | null;
  sellThroughLastHour: number;
  pageViewsLastHour: number;
  conversionRateLastHour: number;
  activeCampaignIds: string[];
  score: number;
  severity: RiskSeverity;
  confidence: number;
  reasons: string[];
  evidence: EvidenceItem[];
}

export interface TicketPriority {
  ticketId: string;
  orderId: string | null;
  customerId: string | null;
  urgency: SupportUrgency;
  sentiment: SupportSentiment;
  channel: string | null;
  message: string | null;
  score: number;
  severity: RiskSeverity;
  confidence: number;
  reasons: string[];
  evidence: EvidenceItem[];
}

export interface CampaignRisk {
  campaignId: string;
  source: string | null;
  status: CampaignStatus;
  targetSku: string | null;
  targetCity: string | null;
  intensity: CampaignIntensity;
  budgetSpent: number;
  trafficGrowth: number;
  conversionRate: number;
  score: number;
  severity: RiskSeverity;
  confidence: number;
  reasons: string[];
  evidence: EvidenceItem[];
}

export interface ActionItem {
  id: string;
  snapshotId: string;
  rank: number;
  actionType: ActionType;
  severity: RiskSeverity;
  targetType: "order" | "customer" | "sku" | "ticket" | "campaign";
  targetId: string;
  title: string;
  reason: string;
  expectedImpact: string;
  confidence: number;
  owner: ActionOwner;
  automationPossible: boolean;
  score: number;
  evidence: EvidenceItem[];
  relatedEntityIds: string[];
  status: "new" | "acked" | "resolved";
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  category: ActionType | "data_quality";
  severity: RiskSeverity;
  title: string;
  message: string;
  targetId: string;
  relatedActionId: string | null;
  shouldNotifyTelegram: boolean;
  deliveryStatus: "pending" | "sent" | "skipped";
  createdAt: string;
}

export interface LaunchSnapshot {
  name: string;
  code: string;
  startedAt: string | null;
  started: string;
  status: string;
  unitsTotal: number;
  unitsSold: number;
  revenue: number;
  revenueLabel: string;
  aov: number;
  aovLabel: string;
  sessions: number;
  cvr: number;
  cvrLabel: string;
}

export interface SnapshotMetrics {
  totalOrders: number;
  totalCustomers: number;
  totalTickets: number;
  activeCampaigns: number;
  criticalSkus: number;
  urgentTickets: number;
  vipOrdersAtRisk: number;
  topActionsCount: number;
}

export interface DashboardOverview {
  snapshotId: string;
  createdAt: string;
  summary: string;
  metrics: SnapshotMetrics;
  topActions: ActionItem[];
  counts: {
    criticalOrders: number;
    highOrders: number;
    criticalInventory: number;
    highInventory: number;
    urgentTicketItems: number;
    criticalCampaigns: number;
  };
  datasetWarnings: string[];
  persistence: {
    mode: "local_json";
    lastPersistedAt: string | null;
    storeDir: string;
  };
}

export interface NormalizedDataset {
  orders: NormalizedOrder[];
  customers: NormalizedCustomer[];
  inventory: NormalizedInventoryItem[];
  tickets: NormalizedSupportTicket[];
  campaigns: NormalizedCampaign[];
  warnings: string[];
}

export interface ComputedSnapshot {
  snapshotId: string;
  datasetFingerprint: string;
  datasetPath: string;
  createdAt: string;
  launch: LaunchSnapshot;
  warnings: string[];
  summary: string;
  metrics: SnapshotMetrics;
  orderRisks: OrderRisk[];
  inventoryPressure: InventoryPressure[];
  ticketPriority: TicketPriority[];
  campaignRisks: CampaignRisk[];
  topActions: ActionItem[];
  notifications: NotificationItem[];
  persistence: {
    mode: "local_json";
    persisted: boolean;
    persistedAt: string | null;
    storeDir: string;
  };
}

export interface PersistSnapshotResult {
  persisted: boolean;
  persistedAt: string | null;
  reason?: string;
}
