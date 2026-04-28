/* global React, Ico */
const { useState: uS1 } = React;

// ============================================================
// SHELL: Sidebar + Topbar
// ============================================================

window.Sidebar = function Sidebar({ route, setRoute, counts }) {
  const items = [
    { id: "overview", label: "Panel del lanzamiento", ico: "dashboard", count: null },
    { id: "actions", label: "Cola de acciones", ico: "list", count: counts.actions, tone: "crit" },
    { id: "orders", label: "Pedidos en riesgo", ico: "cart", count: counts.orders, tone: "hot" },
    { id: "inventory", label: "Presión de stock", ico: "box", count: counts.inventory, tone: "crit" },
    { id: "support", label: "Escalado de soporte", ico: "chat", count: counts.support, tone: "hot" },
    { id: "campaigns", label: "Riesgo de campañas", ico: "megaphone", count: counts.campaigns, tone: "" },
    { id: "notifications", label: "Notificaciones", ico: "bell", count: counts.notifications, tone: "" },
  ];

  return (
    <aside className="sidebar">
      <div className="nav-section">
        <div className="label">Operación</div>
        {items.slice(0, 4).map((it) => {
          const Icon = Ico[it.ico];
          return (
            <a key={it.id} className={`nav-item${route === it.id ? " active" : ""}`}
              onClick={(e) => { e.preventDefault(); setRoute(it.id); }} href="#">
              <Icon className="ico" />
              <span>{it.label}</span>
              {it.count != null && <span className={`count ${it.tone || ""}`}>{it.count}</span>}
            </a>
          );
        })}
      </div>
      <div className="nav-section">
        <div className="label">Vigilancia</div>
        {items.slice(4).map((it) => {
          const Icon = Ico[it.ico];
          return (
            <a key={it.id} className={`nav-item${route === it.id ? " active" : ""}`}
              onClick={(e) => { e.preventDefault(); setRoute(it.id); }} href="#">
              <Icon className="ico" />
              <span>{it.label}</span>
              {it.count != null && it.count > 0 && <span className={`count ${it.tone || ""}`}>{it.count}</span>}
            </a>
          );
        })}
      </div>
      <div className="sidebar-foot">
        <div className="label">Ventana del drop</div>
        <div className="text-mono" style={{ fontSize: 11, color: "var(--text-1)" }}>
          T+02:14:08 / T+72:00:00
        </div>
        <div style={{ height: 3, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
          <div style={{ width: "3%", height: "100%", background: "var(--bone)" }} />
        </div>
        <div className="user-chip">
          <div className="avatar">PC</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 12, color: "var(--text-0)" }}>P. Cervera</span>
            <span style={{ fontSize: 10, color: "var(--text-2)", fontFamily: "var(--mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Resp. de operaciones</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

window.Topbar = function Topbar({ launch, onExport, onRefresh }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">S</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span className="brand-name">SCUFFERS</span>
          <span className="brand-sub">Dashboard centralizado</span>
        </div>
      </div>
      <div className="topbar-snapshot">
        <div className="snap"><span className="live-dot" /><span className="k">En vivo</span><span className="v">{launch.status}</span></div>
        <div className="snap"><span className="k">Drop</span><span className="v">{launch.code}</span></div>
        <div className="snap"><span className="k">Tiempo</span><span className="v">{launch.started}</span></div>
        <div className="snap"><span className="k">Vendidas</span><span className="v">{launch.units_sold} / {launch.units_total}</span></div>
        <div className="snap"><span className="k">Ingresos</span><span className="v">{launch.revenue}</span></div>
        <div className="snap"><span className="k">CVR</span><span className="v hot">{launch.cvr}</span></div>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" onClick={onRefresh} title="Actualizar"><Ico.refresh /></button>
        <button className="btn btn-sm" onClick={onExport}><Ico.download style={{ width: 12, height: 12 }} /> JSON</button>
        <button className="btn btn-sm btn-primary"><Ico.send style={{ width: 12, height: 12 }} /> Telegram</button>
      </div>
    </header>
  );
};
