/* global React, Ico, ActionCard, AlertFeed, RiskRadar, KpiRibbon, Hero, Pill */
const { useState: uS3 } = React;

// ============================================================
// PAGE: OVERVIEW (Launch Control)
// ============================================================

window.OverviewPage = function OverviewPage({ data, expanded, setExpanded, acked, onAck, onDismiss, onOpenJson }) {
  return (
    <div className="page">
      <Hero launch={data.launch} summary={data.summary} onOpenJson={onOpenJson} />

      <div className="section">
        <div className="section-head">
          <div className="titles">
            <div className="label">Presión / KPI ribbon</div>
            <h2>Estado operativo</h2>
          </div>
          <span className="label">snapshot · hace 12s</span>
        </div>
        <KpiRibbon items={data.kpis} />
      </div>

      <div className="layout-2col">
        <div>
          <div className="section">
            <div className="section-head">
              <div className="titles">
                <div className="label">Top 10 acciones ahora</div>
                <h2>Qué debería hacer el equipo ahora</h2>
              </div>
              <div className="toolbar">
                <button className="filter on">Todas</button>
                <button className="filter">Críticas · 2</button>
                <button className="filter">Altas · 4</button>
                <button className="filter">Medias · 3</button>
                <span className="sep" />
                <button className="filter"><Ico.filter style={{width:11,height:11}}/> Responsable</button>
              </div>
            </div>
            <div className="action-list stagger">
              {data.actions.map((a) => (
                <ActionCard
                  key={a.rank}
                  action={a}
                  expanded={expanded === a.rank}
                  onToggle={() => setExpanded(expanded === a.rank ? null : a.rank)}
                  acked={acked.includes(a.rank)}
                  onAck={(e) => { e.stopPropagation(); onAck(a.rank); }}
                  onDismiss={(e) => { e.stopPropagation(); onDismiss(a.rank); }}
                />
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <div className="titles">
                <div className="label">Radar de riesgo · por dominio</div>
                <h2>De dónde viene la tensión</h2>
              </div>
            </div>
            <RiskRadar items={data.radar} />
          </div>
        </div>

        <AlertFeed alerts={data.alerts} />
      </div>
    </div>
  );
};

// ============================================================
// PAGE: ACTION QUEUE
// ============================================================

window.ActionQueuePage = function ActionQueuePage({ data, expanded, setExpanded, acked, onAck, onDismiss }) {
  const [sev, setSev] = uS3("all");
  const filtered = data.actions.filter(a => sev === "all" || a.severity === sev);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow"><span className="dash" /><span className="label-strong">Cola · priorizada</span></div>
          <h1 className="h-display" style={{fontSize: 44, margin: 0}}>Cola de acciones</h1>
          <p className="text-1" style={{margin: "10px 0 0", maxWidth: 640}}>
            Decisiones priorizadas por el modelo. Cada tarjeta tiene rank, motivo, evidencia y CTA.
            Confirmar para marcar acción tomada. Descartar si no aplica.
          </p>
        </div>
        <div className="toolbar">
          {[
            ["all","Todas"],["critical","Críticas"],["high","Altas"],["medium","Medias"],["resolved","Resueltas"]
          ].map(([k, lbl]) => (
            <button key={k} className={`filter${sev===k?" on":""}`} onClick={() => setSev(k)}>{lbl}</button>
          ))}
        </div>
      </div>

      <div className="action-list stagger">
        {filtered.map((a) => (
          <ActionCard
            key={a.rank}
            action={a}
            expanded={expanded === a.rank}
            onToggle={() => setExpanded(expanded === a.rank ? null : a.rank)}
            acked={acked.includes(a.rank)}
            onAck={(e) => { e.stopPropagation(); onAck(a.rank); }}
            onDismiss={(e) => { e.stopPropagation(); onDismiss(a.rank); }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// PAGE: ORDERS RISK
// ============================================================

window.OrdersRiskPage = function OrdersRiskPage({ data }) {
  const [filter, setFilter] = uS3("all");
  const [selected, setSelected] = uS3(data.orders[0].id);

  const filtered = data.orders.filter(o => {
    if (filter === "vip") return o.vip;
    if (filter === "express") return o.ship === "Express";
    if (filter === "delayed") return o.status === "Delayed" || o.status === "Pending";
    if (filter === "madrid") return o.city === "Madrid";
    return true;
  });

  const sel = data.orders.find(o => o.id === selected);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow"><span className="dash" /><span className="label-strong">Pedidos · score de riesgo</span></div>
          <h1 className="h-display" style={{fontSize: 44, margin: 0}}>Pedidos en riesgo</h1>
          <p className="text-1" style={{margin: "10px 0 0", maxWidth: 640}}>
            Pedidos en riesgo de SLA, satisfacción o fuga. El score combina VIP, ciudad, envío, stock y soporte.
          </p>
        </div>
      </div>

      <div className="toolbar" style={{marginBottom: 18}}>
        {[
          ["all","Todos", data.orders.length],["vip","VIP",4],["express","Express",6],["delayed","Retrasados / Pendientes",8],["madrid","Madrid",6]
        ].map(([k, lbl, n]) => (
          <button key={k} className={`filter${filter===k?" on":""}`} onClick={() => setFilter(k)}>
            {lbl} · {n}
          </button>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 380px", gap: 24, alignItems: "flex-start"}}>
        <div className="card" style={{padding: 0, overflow:"hidden"}}>
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th><th>Cliente</th><th>SKU</th><th>Ciudad</th><th>Envío</th><th>Estado</th><th style={{textAlign:"right"}}>Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className={selected===o.id?"selected":""} onClick={() => setSelected(o.id)}>
                  <td className="id">{o.id}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {o.customer}
                      {o.vip && <Pill tone="vip">VIP</Pill>}
                    </div>
                  </td>
                  <td className="id">{o.sku}</td>
                  <td>{o.city}</td>
                  <td>{o.ship === "Express" ? <Pill tone="hot">Express</Pill> : <span className="text-2">{o.ship}</span>}</td>
                  <td>
                    {o.status==="Retrasado" && <Pill tone="crit">Retrasado</Pill>}
                    {o.status==="Pendiente" && <Pill tone="hot">Pendiente</Pill>}
                    {o.status==="Resuelto" && <Pill tone="ok">Resuelto</Pill>}
                    {o.status==="Confirmado" && <Pill tone="ok">Confirmado</Pill>}
                  </td>
                  <td className="num">
                    <span style={{
                      color: o.risk > 80 ? "var(--red)" : o.risk > 60 ? "var(--amber)" : o.risk > 40 ? "var(--blue)" : "var(--green)",
                      fontWeight: 600
                    }}>{o.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sel && (
          <div className="card" style={{position:"sticky", top:24}}>
            <div style={{padding: "16px 18px", borderBottom: "1px solid var(--line)"}}>
              <div className="label">Pedido seleccionado · detalle</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                <span style={{fontFamily:"var(--display)",fontSize:18,fontWeight:500}}>{sel.id}</span>
                {sel.vip && <Pill tone="vip">VIP</Pill>}
              </div>
            </div>
            <div className="card-pad" style={{display:"flex",flexDirection:"column",gap:14}}>
              <div className="evidence-grid">
                <div className="evidence-item"><span className="l">Cliente</span><span className="v">{sel.customer}</span></div>
                <div className="evidence-item"><span className="l">SKU</span><span className="v">{sel.sku}</span></div>
                <div className="evidence-item"><span className="l">Ciudad</span><span className="v">{sel.city}</span></div>
                <div className="evidence-item"><span className="l">Envío</span><span className="v">{sel.ship}</span></div>
                <div className="evidence-item"><span className="l">Estado</span><span className="v">{sel.status}</span></div>
                <div className="evidence-item"><span className="l">Score de riesgo</span><span className="v" style={{color:"var(--red)"}}>{sel.risk}</span></div>
              </div>
              <div>
                <div className="label" style={{marginBottom:6}}>Por qué el score es {sel.risk}</div>
                <div className="text-1" style={{fontSize:13, lineHeight: 1.6}}>{sel.reason}</div>
              </div>
              <div style={{display:"flex",gap:8, marginTop:6}}>
                <button className="btn btn-sm btn-primary"><Ico.zap style={{width:12,height:12}}/> Escalar</button>
                <button className="btn btn-sm">Abrir ticket</button>
                <button className="btn btn-sm btn-ghost">Ver pedido</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// PAGE: INVENTORY PRESSURE
// ============================================================

window.InventoryPage = function InventoryPage({ data }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow"><span className="dash" /><span className="label-strong">Inventario · mapa de presión</span></div>
          <h1 className="h-display" style={{fontSize: 44, margin: 0}}>Presión de stock</h1>
          <p className="text-1" style={{margin: "10px 0 0", maxWidth: 640}}>
            Tensión por SKU. Cruce de stock, sell-through, conversión y colisión con campañas activas.
          </p>
        </div>
        <div className="toolbar">
          <button className="filter on">Por presión</button>
          <button className="filter">Por SKU</button>
          <button className="filter">Por familia</button>
        </div>
      </div>

      <div className="heatgrid" style={{marginBottom: 28}}>
        <div className="heat-row header">
          <div className="cell sku">SKU</div>
          <div className="cell">Stock</div>
          <div className="cell">Reposición</div>
          <div className="cell">Sell-thru</div>
          <div className="cell">Visitas</div>
          <div className="cell">CVR</div>
          <div className="cell">Campañas</div>
          <div className="cell">Presión</div>
          <div className="cell">Acción</div>
        </div>
        {data.inventory.map((i) => (
          <div key={i.sku} className="heat-row">
            <div className="cell sku">
              <span>{i.name}</span>
              <span className="sub">{i.sku}</span>
            </div>
            <div className="cell metric" style={{color: i.stock < 10 ? "var(--red)" : i.stock < 25 ? "var(--amber)" : "var(--text-0)"}}>{i.stock} u.</div>
            <div className="cell metric">{i.eta}</div>
            <div className="cell metric">{i.through}%</div>
            <div className="cell metric">{i.views.toLocaleString()}</div>
            <div className="cell metric">{i.cvr}</div>
            <div className="cell metric">{i.camp}</div>
            <div className={`cell heat h-${i.h}`}>
              {i.h === 5 ? "CRÍT" : i.h === 4 ? "ALTA" : i.h === 3 ? "ELEV" : i.h === 2 ? "MED" : i.h === 1 ? "BAJA" : "·"}
            </div>
            <div className="cell metric">
              {i.h >= 4 ? <button className="btn btn-sm btn-danger">Pausar camp.</button>
                : i.h === 3 ? <button className="btn btn-sm">Reservar</button>
                : <span className="text-2">—</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{gridTemplateColumns:"repeat(3, 1fr)"}}>
        <div className="card card-pad">
          <div className="label">SKUs críticos</div>
          <div className="h-display" style={{fontSize: 36, color: "var(--red)", marginTop: 8}}>4</div>
          <div className="text-1" style={{fontSize: 12, marginTop: 6}}>HOODIE-BLK-M, TEE-CRM-L y 2 más</div>
        </div>
        <div className="card card-pad">
          <div className="label">Presión media</div>
          <div className="h-display" style={{fontSize: 36, color: "var(--amber)", marginTop: 8}}>62</div>
          <div className="text-1" style={{fontSize: 12, marginTop: 6}}>+18 vs. drop 03 hora 2</div>
        </div>
        <div className="card card-pad">
          <div className="label">Reposiciones ETA</div>
          <div className="h-display" style={{fontSize: 36, color: "var(--bone)", marginTop: 8}}>2</div>
          <div className="text-1" style={{fontSize: 12, marginTop: 6}}>PANT-NVY-32 · BAG-ECR-OS</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STUB PAGES
// ============================================================

window.StubPage = function StubPage({ title, kicker, lead, items }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow"><span className="dash" /><span className="label-strong">{kicker}</span></div>
          <h1 className="h-display" style={{fontSize: 44, margin: 0}}>{title}</h1>
          <p className="text-1" style={{margin: "10px 0 0", maxWidth: 640}}>{lead}</p>
        </div>
      </div>
      <div className="grid" style={{gridTemplateColumns:"repeat(2, 1fr)"}}>
        {items.map((it, i) => (
          <div key={i} className={`card card-pad`} style={{borderLeft: `3px solid ${it.color}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div className="label">{it.kicker}</div>
                <div style={{fontFamily:"var(--display)", fontSize: 18, marginTop: 6}}>{it.title}</div>
              </div>
              <Pill tone={it.tone}>{it.badge}</Pill>
            </div>
            <p className="text-1" style={{fontSize: 13, marginTop: 12, lineHeight: 1.6}}>{it.body}</p>
            <div style={{display:"flex", gap:8, marginTop: 14}}>
              {it.actions.map((a, j) => (
                <button key={j} className={`btn btn-sm ${a.primary ? "btn-primary" : ""}`}>{a.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
