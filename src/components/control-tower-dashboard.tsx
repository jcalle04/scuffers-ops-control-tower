"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";

import type {
  ControlTowerAction,
  ControlTowerAlert,
  ControlTowerCardItem,
  ControlTowerInventoryRow,
  ControlTowerOrderRow,
  ControlTowerRadarItem,
  ControlTowerSummaryToken,
  ControlTowerViewModel,
} from "@/lib/ops/control-tower-model";

type RouteKey =
  | "overview"
  | "actions"
  | "orders"
  | "inventory"
  | "support"
  | "campaigns"
  | "notifications";

interface ControlTowerDashboardProps {
  initialData: ControlTowerViewModel;
}

interface SidebarCounts {
  actions: number;
  orders: number;
  inventory: number;
  support: number;
  campaigns: number;
  notifications: number;
  timeWindow: string;
}

const Ico = {
  dashboard: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </svg>
  ),
  list: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  ),
  box: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M2 5l6-3 6 3v6l-6 3-6-3V5z" />
      <path d="M2 5l6 3 6-3M8 8v6" />
    </svg>
  ),
  chat: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M3 3h10v8H7l-3 3v-3H3V3z" />
    </svg>
  ),
  cart: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M2 3h2l1.5 8h7L14 5H5" />
      <circle cx="6" cy="13.5" r="1" />
      <circle cx="12" cy="13.5" r="1" />
    </svg>
  ),
  megaphone: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M3 6v4l8 3V3L3 6zM11 5v6M3 10v2h2v-2" />
    </svg>
  ),
  bell: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M4 11V7a4 4 0 018 0v4l1 1H3l1-1zM7 13.5a1.5 1.5 0 002 0" />
    </svg>
  ),
  download: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M8 2v8m-3-3l3 3 3-3M3 13h10" />
    </svg>
  ),
  copy: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <rect x="5" y="5" width="9" height="9" />
      <path d="M11 5V2H2v9h3" />
    </svg>
  ),
  close: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M2 8L14 2L9 14L7.5 9L2 8z" />
    </svg>
  ),
  zap: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M9 2L3 9h4l-1 5 6-7H8l1-5z" />
    </svg>
  ),
  check: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M3 8l3 3 7-7" />
    </svg>
  ),
  filter: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M2 3h12l-4.5 6v4l-3 1V9L2 3z" />
    </svg>
  ),
  refresh: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M13 3v4h-4M3 13v-4h4" />
      <path d="M13 7a5 5 0 00-9-2M3 9a5 5 0 009 2" />
    </svg>
  ),
};

function Pill({
  tone = "",
  children,
}: {
  tone?: "" | "crit" | "hot" | "info" | "ok" | "vip";
  children: React.ReactNode;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

function KpiRibbon({ items }: { items: ControlTowerViewModel["kpis"] }) {
  return (
    <div className="kpi-ribbon">
      {items.map((item) => (
        <div key={item.k} className={`kpi ${item.tone || ""}`}>
          <div className="k">{item.k}</div>
          <div className="v">{item.v}</div>
          <div className="delta">{item.delta}</div>
          <div className="spark" />
        </div>
      ))}
    </div>
  );
}

function Hero({
  launch,
  summary,
  onOpenJson,
  onRefresh,
  isRefreshing,
}: {
  launch: ControlTowerViewModel["launch"];
  summary: ControlTowerSummaryToken[];
  onOpenJson: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="hero">
      <div className="hero-status">
        <span className="live-dot" /> Presion en aumento
      </div>
      <div className="hero-row">
        <div>
          <div className="eyebrow">
            <span className="dash" />
            <span className="label-strong">Panel del lanzamiento / {launch.code}</span>
          </div>
          <h1 className="hero-title">
            {launch.name} esta vivo.
            <br />
            <span className="accent">10 decisiones</span> definen las proximas
            horas.
          </h1>
          <div className="hero-meta">
            <div className="cell">
              <span className="label">Hora</span>
              <span className="v">{launch.started}</span>
            </div>
            <div className="cell">
              <span className="label">Vendidas</span>
              <span className="v">
                {launch.units_sold}{" "}
                <span style={{ color: "var(--text-2)" }}>/ {launch.units_total}</span>
              </span>
            </div>
            <div className="cell">
              <span className="label">Ingresos</span>
              <span className="v">{launch.revenue}</span>
            </div>
            <div className="cell">
              <span className="label">Ticket medio</span>
              <span className="v">{launch.aov}</span>
            </div>
            <div className="cell">
              <span className="label">CVR</span>
              <span className="v hot">{launch.cvr}</span>
            </div>
            <div className="cell">
              <span className="label">Sesiones</span>
              <span className="v">{launch.sessions.toLocaleString("es-ES")}</span>
            </div>
          </div>
        </div>
        <div className="hero-summary">
          <div className="label-strong">Resumen ejecutivo / IA</div>
          <p>
            {summary.map((token, index) => {
              if (token.type === "strong") {
                return <strong key={index}>{token.value}</strong>;
              }
              if (token.type === "red") {
                return (
                  <span key={index} className="red">
                    {token.value}
                  </span>
                );
              }
              if (token.type === "amber") {
                return (
                  <span key={index} className="amber">
                    {token.value}
                  </span>
                );
              }
              if (token.type === "green") {
                return (
                  <span key={index} className="green">
                    {token.value}
                  </span>
                );
              }
              return <span key={index}>{token.value}</span>;
            })}
          </p>
          <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={onOpenJson}>
              <Ico.copy style={{ width: 12, height: 12 }} />
              Exportar JSON
            </button>
            <button className="btn btn-sm btn-ghost" onClick={onRefresh}>
              <Ico.refresh
                className={isRefreshing ? "spin" : undefined}
                style={{ width: 12, height: 12 }}
              />
              {isRefreshing ? "Actualizando..." : "Actualizar snapshot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  action,
  expanded,
  onToggle,
  acked,
  onAck,
  onDismiss,
}: {
  action: ControlTowerAction;
  expanded: boolean;
  acked: boolean;
  onToggle: () => void;
  onAck: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`action sev-${action.severity}${expanded ? " expanded" : ""}${
        acked ? " acked" : ""
      }`}
      onClick={onToggle}
    >
      <div className="action-rank">{String(action.rank).padStart(2, "0")}</div>
      <div className="action-body">
        <div className="action-meta">
          <span className="sev">{action.severity}</span>
          <span className="dot" />
          <span>{action.type.replace(/_/g, " ")}</span>
          <span className="dot" />
          <span>RESP / {action.owner}</span>
          {action.automation ? (
            <>
              <span className="dot" />
              <span style={{ color: "var(--bone)" }}>AUTOMATIZABLE</span>
            </>
          ) : null}
        </div>
        <h3 className="action-title">{action.title}</h3>
        <p className="action-reason">{action.reason}</p>
        <div className="action-pills">
          {action.pills.map((pill) => (
            <Pill key={`${action.rank}-${pill.label}`} tone={pill.tone}>
              {pill.label}
            </Pill>
          ))}
        </div>
      </div>
      <div className="action-side">
        <div className="action-confidence">
          <span>conf. {action.confidence.toFixed(2)}</span>
          <div className="confidence-bar">
            <span style={{ width: `${action.confidence * 100}%` }} />
          </div>
        </div>
        <div className="action-cta" onClick={(event) => event.stopPropagation()}>
          {!acked && action.severity !== "resolved" ? (
            <>
              <button className="btn btn-sm btn-ghost" onClick={onDismiss}>
                Descartar
              </button>
              <button className="btn btn-sm btn-primary" onClick={onAck}>
                <Ico.check style={{ width: 12, height: 12 }} />
                Confirmar
              </button>
            </>
          ) : null}
          {acked ? (
            <span className="pill ok">
              <Ico.check style={{ width: 9, height: 9 }} />
              Confirmada
            </span>
          ) : null}
          {action.severity === "resolved" ? <span className="pill ok">Resuelta</span> : null}
        </div>
      </div>
      {expanded ? (
        <div className="evidence" onClick={(event) => event.stopPropagation()}>
          <div className="evidence-block">
            <h4>Evidencia / inputs usados</h4>
            <div className="evidence-grid">
              {action.evidence.items.map((item) => (
                <div key={`${action.rank}-${item.l}`} className="evidence-item">
                  <span className="l">{item.l}</span>
                  <span className="v">{String(item.v ?? "-")}</span>
                </div>
              ))}
            </div>
            <div className="evidence-note">{action.evidence.note}</div>
          </div>
          <div className="evidence-block">
            <h4>Por que salio ranqueada #{action.rank}</h4>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--text-1)",
                lineHeight: 1.7,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>peso severidad</span>
                <span>{(action.confidence * 0.4).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>impacto VIP</span>
                <span>
                  {action.pills.some((pill) => pill.label.toLowerCase().includes("vip"))
                    ? "+0.18"
                    : "0.00"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>tiempo a impacto</span>
                <span>0.21</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>frescura del dato</span>
                <span style={{ color: "var(--green)" }}>0.96</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px dashed var(--line)",
                  marginTop: 6,
                  paddingTop: 6,
                  color: "var(--text-0)",
                }}
              >
                <span>composite</span>
                <span>{action.confidence.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AlertFeed({ alerts }: { alerts: ControlTowerAlert[] }) {
  return (
    <div className="alert-feed">
      <div className="alert-feed-head">
        <h3>Stream de alertas</h3>
        <span className="label">en vivo / {alerts.length}</span>
      </div>
      <div className="alert-feed-list">
        {alerts.map((alert, index) => (
          <div key={`${alert.txt}-${index}`} className={`alert ${alert.sev}${alert.isNew ? " new" : ""}`}>
            <div className="dot" />
            <div className="body">
              {alert.isNew ? <span className="badge">NEW</span> : null}
              <div className="txt">{alert.txt}</div>
              <div className="src">{alert.src}</div>
            </div>
            <div className="time">{alert.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskRadar({ items }: { items: ControlTowerRadarItem[] }) {
  return (
    <div className="radar">
      {items.map((item) => (
        <div key={item.name} className={`radar-cell ${item.tone}`}>
          <div className="radar-head">
            <span className="name">{item.name}</span>
            <span className="lvl">{item.value}</span>
          </div>
          <div className="radar-val">{item.level}</div>
          <div className="radar-bar">
            <span style={{ width: `${item.level}%` }} />
          </div>
          <div className="radar-foot">{item.note}</div>
        </div>
      ))}
    </div>
  );
}

function JsonDrawer({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: unknown;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) {
    return null;
  }

  const json = JSON.stringify(data, null, 2);
  const highlighted = json
    .replace(/("[^"]+"):/g, '<span class="k">$1</span>:')
    .replace(/: ("[^"]*")/g, ': <span class="s">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="n">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="b">$1</span>');

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="label">Salida / contrato</div>
            <h3>actions.snapshot.json</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={copy}>
              <Ico.copy style={{ width: 12, height: 12 }} />
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button className="icon-btn" onClick={onClose}>
              <Ico.close />
            </button>
          </div>
        </div>
        <div className="drawer-body">
          <pre className="json-view" dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      </div>
    </>
  );
}

function Sidebar({
  route,
  setRoute,
  counts,
}: {
  route: RouteKey;
  setRoute: (route: RouteKey) => void;
  counts: SidebarCounts;
}) {
  const items = [
    { id: "overview", label: "Panel del lanzamiento", ico: "dashboard", count: null },
    { id: "actions", label: "Cola de acciones", ico: "list", count: counts.actions, tone: "crit" },
    { id: "orders", label: "Pedidos en riesgo", ico: "cart", count: counts.orders, tone: "hot" },
    { id: "inventory", label: "Presion de stock", ico: "box", count: counts.inventory, tone: "crit" },
    { id: "support", label: "Escalado de soporte", ico: "chat", count: counts.support, tone: "hot" },
    { id: "campaigns", label: "Riesgo de campanas", ico: "megaphone", count: counts.campaigns, tone: "" },
    { id: "notifications", label: "Notificaciones", ico: "bell", count: counts.notifications, tone: "" },
  ] as const;

  return (
    <aside className="sidebar">
      <div className="nav-section">
        <div className="label">Operacion</div>
        {items.slice(0, 4).map((item) => {
          const Icon = Ico[item.ico];
          return (
            <a
              key={item.id}
              className={`nav-item${route === item.id ? " active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                setRoute(item.id);
              }}
              href="#"
            >
              <Icon className="ico" />
              <span>{item.label}</span>
              {item.count !== null ? <span className={`count ${item.tone || ""}`}>{item.count}</span> : null}
            </a>
          );
        })}
      </div>
      <div className="nav-section">
        <div className="label">Vigilancia</div>
        {items.slice(4).map((item) => {
          const Icon = Ico[item.ico];
          return (
            <a
              key={item.id}
              className={`nav-item${route === item.id ? " active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                setRoute(item.id);
              }}
              href="#"
            >
              <Icon className="ico" />
              <span>{item.label}</span>
              {item.count !== null && item.count > 0 ? (
                <span className={`count ${item.tone || ""}`}>{item.count}</span>
              ) : null}
            </a>
          );
        })}
      </div>
      <div className="sidebar-foot">
        <div className="label">Ventana del drop</div>
        <div className="text-mono" style={{ fontSize: 11, color: "var(--text-1)" }}>
          {counts.timeWindow}
        </div>
        <div
          style={{
            height: 3,
            background: "var(--bg-3)",
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 2,
          }}
        >
          <div style={{ width: "12%", height: "100%", background: "var(--bone)" }} />
        </div>
        <div className="user-chip">
          <div className="avatar">SC</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 12, color: "var(--text-0)" }}>Scuffers Ops</span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-2)",
                fontFamily: "var(--mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Control tower
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({
  launch,
  onExport,
  onRefresh,
  onOpenNotifications,
  isRefreshing,
}: {
  launch: ControlTowerViewModel["launch"];
  onExport: () => void;
  onRefresh: () => void;
  onOpenNotifications: () => void;
  isRefreshing: boolean;
}) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-logo-wrap">
          <Image
            src="/scuffers-logo.png"
            alt="Scuffers logo"
            width={32}
            height={32}
            className="brand-logo"
            priority
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span className="brand-name">SCUFFERS</span>
          <span className="brand-sub">Dashboard centralizado</span>
        </div>
      </div>
      <div className="topbar-snapshot">
        <div className="snap">
          <span className="live-dot" />
          <span className="k">En vivo</span>
          <span className="v">{launch.status}</span>
        </div>
        <div className="snap">
          <span className="k">Drop</span>
          <span className="v">{launch.code}</span>
        </div>
        <div className="snap">
          <span className="k">Hora</span>
          <span className="v">{launch.started}</span>
        </div>
        <div className="snap">
          <span className="k">Vendidas</span>
          <span className="v">
            {launch.units_sold} / {launch.units_total}
          </span>
        </div>
        <div className="snap">
          <span className="k">Ingresos</span>
          <span className="v">{launch.revenue}</span>
        </div>
        <div className="snap">
          <span className="k">CVR</span>
          <span className="v hot">{launch.cvr}</span>
        </div>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" onClick={onRefresh} title="Actualizar">
          <Ico.refresh className={isRefreshing ? "spin" : undefined} />
        </button>
        <button className="btn btn-sm" onClick={onExport}>
          <Ico.download style={{ width: 12, height: 12 }} /> JSON
        </button>
        <button className="btn btn-sm btn-primary" onClick={onOpenNotifications}>
          <Ico.send style={{ width: 12, height: 12 }} /> Telegram
        </button>
      </div>
    </header>
  );
}

function OverviewPage({
  data,
  visibleActions,
  expanded,
  setExpanded,
  acked,
  onAck,
  onDismiss,
  onOpenJson,
  onRefresh,
  isRefreshing,
}: {
  data: ControlTowerViewModel;
  visibleActions: ControlTowerAction[];
  expanded: number | null;
  setExpanded: (value: number | null) => void;
  acked: number[];
  onAck: (rank: number) => void;
  onDismiss: (rank: number) => void;
  onOpenJson: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const criticalCount = visibleActions.filter((action) => action.severity === "critical").length;
  const highCount = visibleActions.filter((action) => action.severity === "high").length;
  const mediumCount = visibleActions.filter((action) => action.severity === "medium").length;

  return (
    <div className="page">
      <Hero
        launch={data.launch}
        summary={data.summary}
        onOpenJson={onOpenJson}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="section">
        <div className="section-head">
          <div className="titles">
            <div className="label">Presion / KPI ribbon</div>
            <h2>Estado operativo</h2>
          </div>
              <span className="label">snapshot / actual</span>
        </div>
        <KpiRibbon items={data.kpis} />
      </div>

      <div className="layout-2col">
        <div>
          <div className="section">
            <div className="section-head">
              <div className="titles">
                <div className="label">Top 10 acciones ahora</div>
                <h2>Que deberia hacer el equipo ahora</h2>
              </div>
              <div className="toolbar">
                <button className="filter on">Todas</button>
                <button className="filter">Criticas / {criticalCount}</button>
                <button className="filter">Altas / {highCount}</button>
                <button className="filter">Medias / {mediumCount}</button>
                <span className="sep" />
                <button className="filter">
                  <Ico.filter style={{ width: 11, height: 11 }} /> Responsable
                </button>
              </div>
            </div>
            <div className="action-list stagger">
              {visibleActions.map((action) => (
                <ActionCard
                  key={action.rank}
                  action={action}
                  expanded={expanded === action.rank}
                  onToggle={() => setExpanded(expanded === action.rank ? null : action.rank)}
                  acked={acked.includes(action.rank)}
                  onAck={() => onAck(action.rank)}
                  onDismiss={() => onDismiss(action.rank)}
                />
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <div className="titles">
                <div className="label">Radar de riesgo / por dominio</div>
                <h2>De donde viene la tension</h2>
              </div>
            </div>
            <RiskRadar items={data.radar} />
          </div>
        </div>

        <AlertFeed alerts={data.alerts} />
      </div>
    </div>
  );
}

function ActionQueuePage({
  actions,
  expanded,
  setExpanded,
  acked,
  onAck,
  onDismiss,
}: {
  actions: ControlTowerAction[];
  expanded: number | null;
  setExpanded: (value: number | null) => void;
  acked: number[];
  onAck: (rank: number) => void;
  onDismiss: (rank: number) => void;
}) {
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "high" | "medium" | "resolved"
  >("all");

  const filtered = useMemo(
    () =>
      actions.filter(
        (action) => severityFilter === "all" || action.severity === severityFilter,
      ),
    [actions, severityFilter],
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="dash" />
            <span className="label-strong">Cola / priorizada</span>
          </div>
          <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
            Cola de acciones
          </h1>
          <p className="text-1" style={{ margin: "10px 0 0", maxWidth: 640 }}>
            Decisiones priorizadas por el modelo. Cada tarjeta tiene rank, motivo,
            evidencia y CTA.
          </p>
        </div>
        <div className="toolbar">
          {[
            ["all", "Todas"],
            ["critical", "Criticas"],
            ["high", "Altas"],
            ["medium", "Medias"],
            ["resolved", "Resueltas"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`filter${severityFilter === key ? " on" : ""}`}
              onClick={() => setSeverityFilter(key as typeof severityFilter)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="action-list stagger">
        {filtered.map((action) => (
          <ActionCard
            key={action.rank}
            action={action}
            expanded={expanded === action.rank}
            onToggle={() => setExpanded(expanded === action.rank ? null : action.rank)}
            acked={acked.includes(action.rank)}
            onAck={() => onAck(action.rank)}
            onDismiss={() => onDismiss(action.rank)}
          />
        ))}
      </div>
    </div>
  );
}

function OrdersRiskPage({ orders }: { orders: ControlTowerOrderRow[] }) {
  const [filter, setFilter] = useState<"all" | "vip" | "express" | "delayed">("all");
  const [selected, setSelected] = useState(orders[0]?.id ?? "");

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        if (filter === "vip") return order.vip;
        if (filter === "express") return order.ship === "Express";
        if (filter === "delayed") return order.status === "Retrasado" || order.status === "Pendiente";
        return true;
      }),
    [filter, orders],
  );

  const selectedOrder = filtered.find((order) => order.id === selected) ?? filtered[0];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="dash" />
            <span className="label-strong">Pedidos / score de riesgo</span>
          </div>
          <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
            Pedidos en riesgo
          </h1>
          <p className="text-1" style={{ margin: "10px 0 0", maxWidth: 640 }}>
            Pedidos en riesgo de SLA, satisfaccion o fuga. El score combina stock,
            soporte, valor de cliente y friccion logistica.
          </p>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 18 }}>
        {[
          ["all", "Todos", orders.length],
          ["vip", "VIP", orders.filter((order) => order.vip).length],
          ["express", "Express", orders.filter((order) => order.ship === "Express").length],
          [
            "delayed",
            "Retrasados / Pendientes",
            orders.filter(
              (order) => order.status === "Retrasado" || order.status === "Pendiente",
            ).length,
          ],
        ].map(([key, label, count]) => (
          <button
            key={key}
            className={`filter${filter === key ? " on" : ""}`}
            onClick={() => setFilter(key as typeof filter)}
          >
            {label} / {count}
          </button>
        ))}
      </div>

      <div className="split-grid">
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>SKU</th>
                <th>Ciudad</th>
                <th>Envio</th>
                <th>Tracking</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className={selectedOrder?.id === order.id ? "selected" : ""}
                  onClick={() => setSelected(order.id)}
                >
                  <td className="id">{order.id}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {order.customer}
                      {order.vip ? <Pill tone="vip">VIP</Pill> : null}
                    </div>
                  </td>
                  <td className="id">{order.sku}</td>
                  <td>{order.city}</td>
                  <td>
                    {order.ship === "Express" ? <Pill tone="hot">Express</Pill> : order.ship}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span>{order.shippingStatus}</span>
                      {order.manualReview ? <Pill tone="crit">Manual</Pill> : null}
                    </div>
                  </td>
                  <td>
                    {order.status === "Retrasado" ? <Pill tone="crit">Retrasado</Pill> : null}
                    {order.status === "Pendiente" ? <Pill tone="hot">Pendiente</Pill> : null}
                    {order.status === "Resuelto" ? <Pill tone="ok">Resuelto</Pill> : null}
                    {order.status === "Confirmado" ? <Pill tone="ok">Confirmado</Pill> : null}
                  </td>
                  <td className="num">
                    <span
                      style={{
                        color:
                          order.risk > 80
                            ? "var(--burgundy)"
                            : order.risk > 60
                              ? "var(--high)"
                              : order.risk > 40
                                ? "var(--safari)"
                                : "var(--olive)",
                        fontWeight: 600,
                      }}
                    >
                      {order.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder ? (
          <div className="card sticky-card">
            <div className="detail-head">
              <div className="label">Pedido seleccionado / detalle</div>
              <div className="detail-head-row">
                <span className="detail-title">{selectedOrder.id}</span>
                {selectedOrder.vip ? <Pill tone="vip">VIP</Pill> : null}
              </div>
            </div>
            <div className="card-pad detail-body">
              <div className="evidence-grid">
                <div className="evidence-item">
                  <span className="l">Cliente</span>
                  <span className="v">{selectedOrder.customer}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">SKU</span>
                  <span className="v">{selectedOrder.sku}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Ciudad</span>
                  <span className="v">{selectedOrder.city}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Envio</span>
                  <span className="v">{selectedOrder.ship}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Tracking</span>
                  <span className="v">{selectedOrder.shippingStatus}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">ETA</span>
                  <span className="v">{selectedOrder.eta}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Delay risk</span>
                  <span className="v">{selectedOrder.delayRisk}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Delay reason</span>
                  <span className="v">{selectedOrder.delayReason}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Delivery attempts</span>
                  <span className="v">{selectedOrder.deliveryAttempts}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Manual review</span>
                  <span className="v">{selectedOrder.manualReview ? "Si" : "No"}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Estado</span>
                  <span className="v">{selectedOrder.status}</span>
                </div>
                <div className="evidence-item">
                  <span className="l">Score de riesgo</span>
                  <span className="v">{selectedOrder.risk}</span>
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>
                  Por que el score es {selectedOrder.risk}
                </div>
                <div className="text-1 detail-reason">{selectedOrder.reason}</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className="btn btn-sm btn-primary">
                  <Ico.zap style={{ width: 12, height: 12 }} /> Escalar
                </button>
                <button className="btn btn-sm">Abrir ticket</button>
                <button className="btn btn-sm btn-ghost">Ver pedido</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InventoryPage({ inventory }: { inventory: ControlTowerInventoryRow[] }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="dash" />
            <span className="label-strong">Inventario / mapa de presion</span>
          </div>
          <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
            Presion de stock
          </h1>
          <p className="text-1" style={{ margin: "10px 0 0", maxWidth: 640 }}>
            Tension por SKU. Cruce de stock, sell-through, conversion y colision con
            campanas activas.
          </p>
        </div>
        <div className="toolbar">
          <button className="filter on">Por presion</button>
          <button className="filter">Por SKU</button>
          <button className="filter">Por familia</button>
        </div>
      </div>

      <div className="heatgrid" style={{ marginBottom: 28 }}>
        <div className="heat-row header">
          <div className="cell sku">SKU</div>
          <div className="cell">Stock</div>
          <div className="cell">Reposicion</div>
          <div className="cell">Sell-thru</div>
          <div className="cell">Visitas</div>
          <div className="cell">CVR</div>
          <div className="cell">Campanas</div>
          <div className="cell">Presion</div>
          <div className="cell">Accion</div>
        </div>
        {inventory.map((item) => (
          <div key={item.sku} className="heat-row">
            <div className="cell sku">
              <span>{item.name}</span>
              <span className="sub">{item.sku}</span>
            </div>
            <div
              className="cell metric"
              style={{
                color:
                  item.stock < 10 ? "var(--burgundy)" : item.stock < 25 ? "var(--high)" : "var(--text-0)",
              }}
            >
              {item.stock} u.
            </div>
            <div className="cell metric">{item.eta}</div>
            <div className="cell metric">{item.through}%</div>
            <div className="cell metric">{item.views.toLocaleString("es-ES")}</div>
            <div className="cell metric">{item.cvr}</div>
            <div className="cell metric">{item.camp}</div>
            <div className={`cell heat h-${item.h}`}>
              {item.h === 5
                ? "CRIT"
                : item.h === 4
                  ? "ALTA"
                  : item.h === 3
                    ? "ELEV"
                    : item.h === 2
                      ? "MED"
                      : item.h === 1
                        ? "BAJA"
                        : "-"}
            </div>
            <div className="cell metric">
              {item.h >= 4 ? (
                <button className="btn btn-sm btn-danger">Pausar camp.</button>
              ) : item.h === 3 ? (
                <button className="btn btn-sm">Reservar</button>
              ) : (
                <span className="text-2">-</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="summary-cards">
        <div className="card card-pad">
          <div className="label">SKUs criticos</div>
          <div className="summary-value summary-crit">
            {inventory.filter((item) => item.h >= 4).length}
          </div>
          <div className="text-1 summary-note">
            {inventory
              .filter((item) => item.h >= 4)
              .slice(0, 3)
              .map((item) => item.sku)
              .join(", ") || "Sin roturas inminentes"}
          </div>
        </div>
        <div className="card card-pad">
          <div className="label">Presion media</div>
          <div className="summary-value summary-hot">
            {Math.round(
              inventory.reduce((sum, item) => sum + item.h * 20, 0) / Math.max(inventory.length, 1),
            )}
          </div>
          <div className="text-1 summary-note">Heatmap sobre stock, trafico y campanas</div>
        </div>
        <div className="card card-pad">
          <div className="label">Reposiciones ETA</div>
          <div className="summary-value">{inventory.filter((item) => item.eta !== "-").length}</div>
          <div className="text-1 summary-note">
            {inventory
              .filter((item) => item.eta !== "-")
              .slice(0, 2)
              .map((item) => `${item.sku} / ${item.eta}`)
              .join(" / ") || "Sin ETA confirmada"}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsPage({
  kicker,
  title,
  lead,
  items,
}: {
  kicker: string;
  title: string;
  lead: string;
  items: ControlTowerCardItem[];
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <span className="dash" />
            <span className="label-strong">{kicker}</span>
          </div>
          <h1 className="h-display" style={{ fontSize: 44, margin: 0 }}>
            {title}
          </h1>
          <p className="text-1" style={{ margin: "10px 0 0", maxWidth: 640 }}>
            {lead}
          </p>
        </div>
      </div>
      <div className="cards-grid">
        {items.map((item) => (
          <div key={`${item.kicker}-${item.title}`} className="card card-pad" style={{ borderLeft: `3px solid ${item.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="label">{item.kicker}</div>
                <div className="card-title">{item.title}</div>
              </div>
              <Pill tone={item.tone}>{item.badge}</Pill>
            </div>
            <p className="text-1 card-body-copy">{item.body}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              {item.actions.map((action) => (
                <button
                  key={`${item.kicker}-${action.label}`}
                  className={`btn btn-sm ${action.primary ? "btn-primary" : ""}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ControlTowerDashboard({
  initialData,
}: ControlTowerDashboardProps) {
  const [route, setRoute] = useState<RouteKey>("overview");
  const [expanded, setExpanded] = useState<number | null>(1);
  const [acked, setAcked] = useState<number[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const visibleActions = useMemo(
    () => initialData.actions.filter((action) => !dismissed.includes(action.rank)),
    [dismissed, initialData.actions],
  );

  const counts = useMemo(
    () => ({
      actions: visibleActions.filter(
        (action) => action.severity !== "resolved" && !acked.includes(action.rank),
      ).length,
      orders: initialData.orders.filter((order) => order.risk > 60).length,
      inventory: initialData.inventory.filter((item) => item.h >= 4).length,
      support: initialData.supportItems.length,
      campaigns: initialData.campaignItems.length,
      notifications: initialData.alerts.filter((alert) => alert.isNew).length,
      timeWindow: initialData.launch.started,
    }),
    [acked, initialData.alerts, initialData.campaignItems.length, initialData.inventory, initialData.launch.started, initialData.orders, initialData.supportItems.length, visibleActions],
  );

  const refreshSnapshot = () => {
    startRefresh(async () => {
      await fetch("/api/compute/rebuild", { method: "POST" });
      window.location.reload();
    });
  };

  const currentJsonData = useMemo(
    () =>
      visibleActions.map((action) => ({
        rank: action.rank,
        action_type: action.type.toLowerCase(),
        target_id: action.title,
        title: action.title,
        reason: action.reason,
        expected_impact: action.evidence.note,
        confidence: action.confidence,
        owner: action.owner,
        automation_possible: action.automation,
      })),
    [visibleActions],
  );

  return (
    <>
      <div className="grain" />
      <div className="app">
        <Topbar
          launch={initialData.launch}
          onExport={() => setJsonOpen(true)}
          onRefresh={refreshSnapshot}
          onOpenNotifications={() => setRoute("notifications")}
          isRefreshing={isRefreshing}
        />
        <Sidebar route={route} setRoute={setRoute} counts={counts} />
        <main className="main">
          {route === "overview" ? (
            <OverviewPage
              data={initialData}
              visibleActions={visibleActions}
              expanded={expanded}
              setExpanded={setExpanded}
              acked={acked}
              onAck={(rank) => setAcked((current) => (current.includes(rank) ? current : [...current, rank]))}
              onDismiss={(rank) => setDismissed((current) => [...current, rank])}
              onOpenJson={() => setJsonOpen(true)}
              onRefresh={refreshSnapshot}
              isRefreshing={isRefreshing}
            />
          ) : null}
          {route === "actions" ? (
            <ActionQueuePage
              actions={visibleActions}
              expanded={expanded}
              setExpanded={setExpanded}
              acked={acked}
              onAck={(rank) => setAcked((current) => (current.includes(rank) ? current : [...current, rank]))}
              onDismiss={(rank) => setDismissed((current) => [...current, rank])}
            />
          ) : null}
          {route === "orders" ? <OrdersRiskPage orders={initialData.orders} /> : null}
          {route === "inventory" ? <InventoryPage inventory={initialData.inventory} /> : null}
          {route === "support" ? (
            <CardsPage
              kicker="Soporte / escalado"
              title="Escalado de soporte"
              lead="Tickets priorizados por urgencia, sentimiento y vinculo con pedidos sensibles."
              items={initialData.supportItems}
            />
          ) : null}
          {route === "campaigns" ? (
            <CardsPage
              kicker="Campanas / riesgo"
              title="Riesgo de campanas"
              lead="Sobre-presion comercial contrastada contra inventario, ciudad objetivo y conversion real."
              items={initialData.campaignItems}
            />
          ) : null}
          {route === "notifications" ? (
            <CardsPage
              kicker="Actividad / timeline"
              title="Notificaciones"
              lead="Eventos recientes del sistema, alertas creadas y senales listas para escalar."
              items={initialData.notificationItems}
            />
          ) : null}
        </main>
      </div>

      <JsonDrawer
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        data={currentJsonData.length > 0 ? currentJsonData : initialData.jsonData}
      />
    </>
  );
}
