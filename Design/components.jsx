/* global React, Ico */
const { useState: uS2 } = React;

// ============================================================
// SHARED COMPONENTS
// ============================================================

window.Pill = function Pill({ tone = "", children, icon }) {
  return (
    <span className={`pill ${tone}`}>
      {icon}
      {children}
    </span>
  );
};

window.KpiRibbon = function KpiRibbon({ items }) {
  return (
    <div className="kpi-ribbon">
      {items.map((k, i) => (
        <div key={i} className={`kpi ${k.tone || ""}`}>
          <div className="k">{k.k}</div>
          <div className="v">{k.v}</div>
          <div className="delta">{k.delta}</div>
          <div className="spark" />
        </div>
      ))}
    </div>
  );
};

// ============================================================
// HERO
// ============================================================

window.Hero = function Hero({ launch, summary, onOpenJson }) {
  return (
    <div className="hero">
      <div className="hero-status"><span className="live-dot" /> Presión en aumento</div>
      <div className="hero-row">
        <div>
          <div className="eyebrow">
            <span className="dash" />
            <span className="label-strong">Panel del lanzamiento · {launch.code}</span>
          </div>
          <h1 className="hero-title">
            Drop 04 está vivo.<br />
            <span className="accent">10 decisiones</span> definen las próximas 2 horas.
          </h1>
          <div className="hero-meta">
            <div className="cell"><span className="label">Tiempo</span><span className="v">{launch.started}</span></div>
            <div className="cell"><span className="label">Vendidas</span><span className="v">{launch.units_sold} <span style={{color:"var(--text-2)"}}>/ {launch.units_total}</span></span></div>
            <div className="cell"><span className="label">Ingresos</span><span className="v">{launch.revenue}</span></div>
            <div className="cell"><span className="label">Ticket medio</span><span className="v">{launch.aov}</span></div>
            <div className="cell"><span className="label">CVR</span><span className="v hot">{launch.cvr}</span></div>
            <div className="cell"><span className="label">Sesiones</span><span className="v">{launch.sessions.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="hero-summary">
          <div className="label-strong">Resumen ejecutivo · IA</div>
          <p>
            {summary.map((s, i) => {
              if (s.type === "strong") return <strong key={i}>{s.value}</strong>;
              if (s.type === "red") return <span key={i} className="red">{s.value}</span>;
              if (s.type === "amber") return <span key={i} className="amber">{s.value}</span>;
              if (s.type === "green") return <span key={i} className="green">{s.value}</span>;
              return <React.Fragment key={i}>{s.value}</React.Fragment>;
            })}
          </p>
          <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={onOpenJson}><Ico.copy style={{width:12,height:12}}/> Exportar JSON</button>
            <button className="btn btn-sm btn-ghost"><Ico.refresh style={{width:12,height:12}}/> Actualizar snapshot</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// ACTION CARD (used in Overview list and Action Queue)
// ============================================================

window.ActionCard = function ActionCard({ action, expanded, onToggle, acked, onAck, onDismiss }) {
  return (
    <div className={`action sev-${action.severity}${expanded ? " expanded" : ""}${acked ? " acked" : ""}`}
         onClick={onToggle}>
      <div className="action-rank">{String(action.rank).padStart(2, "0")}</div>
      <div className="action-body">
        <div className="action-meta">
          <span className="sev">{action.severity}</span>
          <span className="dot" />
          <span>{action.type.replace(/_/g, " ")}</span>
          <span className="dot" />
          <span>RESP. · {action.owner}</span>
          {action.automation && <><span className="dot" /><span style={{ color: "var(--bone)" }}>AUTOMATIZABLE</span></>}
        </div>
        <h3 className="action-title">{action.title}</h3>
        <p className="action-reason">{action.reason}</p>
        <div className="action-pills">
          {action.pills.map((p, i) => <Pill key={i} tone={p.tone}>{p.label}</Pill>)}
        </div>
      </div>
      <div className="action-side">
        <div className="action-confidence">
          <span>conf. {action.confidence.toFixed(2)}</span>
          <div className="confidence-bar"><span style={{ width: `${action.confidence * 100}%` }} /></div>
        </div>
        <div className="action-cta" onClick={(e) => e.stopPropagation()}>
          {!acked && action.severity !== "resolved" && (
            <>
              <button className="btn btn-sm btn-ghost" onClick={onDismiss}>Descartar</button>
              <button className="btn btn-sm btn-primary" onClick={onAck}>
                <Ico.check style={{width:12,height:12}}/> Confirmar
              </button>
            </>
          )}
          {acked && <span className="pill ok"><Ico.check style={{width:9,height:9}}/> Confirmada</span>}
          {action.severity === "resolved" && <span className="pill ok">Resuelta</span>}
        </div>
      </div>
      {expanded && (
        <div className="evidence" onClick={(e) => e.stopPropagation()}>
          <div className="evidence-block">
            <h4>Evidencia · inputs usados</h4>
            <div className="evidence-grid">
              {action.evidence.items.map((it, i) => (
                <div key={i} className="evidence-item">
                  <span className="l">{it.l}</span>
                  <span className="v">{it.v}</span>
                </div>
              ))}
            </div>
            <div className="evidence-note">{action.evidence.note}</div>
          </div>
          <div className="evidence-block">
            <h4>Por qué salió ranqueada #{action.rank}</h4>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-1)", lineHeight: 1.7 }}>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>peso severidad</span><span>{(action.confidence * 0.4).toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>impacto VIP</span><span>{action.pills.some(p=>p.label==="VIP"||p.label==="VIP en riesgo")?"+0.18":"0.00"}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>tiempo a impacto</span><span>0.21</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span>frescura del dato</span><span style={{color:"var(--green)"}}>0.96</span></div>
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px dashed var(--line)",marginTop:6,paddingTop:6,color:"var(--text-0)"}}><span>composite</span><span>{action.confidence.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ALERT FEED
// ============================================================

window.AlertFeed = function AlertFeed({ alerts }) {
  return (
    <div className="alert-feed">
      <div className="alert-feed-head">
        <h3>Stream de alertas</h3>
        <span className="label">en vivo · {alerts.length}</span>
      </div>
      <div className="alert-feed-list">
        {alerts.map((a, i) => (
          <div key={i} className={`alert ${a.sev}${a.isNew ? " new" : ""}`}>
            <div className="dot" />
            <div className="body">
              {a.isNew && <span className="badge">NEW</span>}
              <div className="txt">{a.txt}</div>
              <div className="src">{a.src}</div>
            </div>
            <div className="time">T+{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// RISK RADAR
// ============================================================

window.RiskRadar = function RiskRadar({ items }) {
  return (
    <div className="radar">
      {items.map((r, i) => (
        <div key={i} className={`radar-cell ${r.tone}`}>
          <div className="radar-head">
            <span className="name">{r.name}</span>
            <span className="lvl">{r.value}</span>
          </div>
          <div className="radar-val">{r.level}</div>
          <div className="radar-bar"><span style={{ width: `${r.level}%` }} /></div>
          <div className="radar-foot">{r.note}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// JSON DRAWER
// ============================================================

window.JsonDrawer = function JsonDrawer({ open, onClose, data }) {
  const [copied, setCopied] = uS2(false);
  if (!open) return null;
  const json = JSON.stringify(data, null, 2);
  const highlighted = json
    .replace(/("[^"]+"):/g, '<span class="k">$1</span>:')
    .replace(/: ("[^"]*")/g, ': <span class="s">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="n">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="b">$1</span>');

  const copy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
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
              <Ico.copy style={{width:12,height:12}}/>
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button className="icon-btn" onClick={onClose}><Ico.close /></button>
          </div>
        </div>
        <div className="drawer-body">
          <pre className="json-view" dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      </div>
    </>
  );
};
