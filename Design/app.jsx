/* global React, ReactDOM, OverviewPage, ActionQueuePage, OrdersRiskPage, InventoryPage, StubPage, Sidebar, Topbar, JsonDrawer, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider, TweakSelect, Pill, Ico */
const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "grain": true,
  "demoMode": "tense",
  "displayFont": "Space Grotesk",
  "accentSeverity": "balanced"
}/*EDITMODE-END*/;

function App() {
  const [route, setRoute] = useState("overview");
  const [expanded, setExpanded] = useState(1);
  const [acked, setAcked] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tick, setTick] = useState(0);

  // Tiny live tick — animates "elapsed" feel
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(() => {
    const base = window.SCUFFERS_DATA;
    if (tweaks.demoMode === "calm") {
      // Quieter mock — clamp severity for demo "all clear" state
      return {
        ...base,
        kpis: base.kpis.map((k, i) => i === 0 ? {...k, v: 3, tone: "ok", delta: "stable"} : i === 1 ? {...k, v: 0, tone: "ok"} : i === 2 ? {...k, v: 1, tone: "", delta: "low traffic"} : i === 3 ? {...k, v: 0, tone: "ok"} : k),
        actions: base.actions.map((a, i) => ({...a, severity: i < 2 ? "high" : i < 5 ? "medium" : "resolved"})),
      };
    }
    return base;
  }, [tweaks.demoMode]);

  const filteredActions = useMemo(() =>
    data.actions.filter(a => !dismissed.includes(a.rank)),
    [data.actions, dismissed]
  );

  const counts = {
    actions: filteredActions.filter(a => a.severity !== "resolved" && !acked.includes(a.rank)).length,
    orders: data.orders.filter(o => o.risk > 60).length,
    inventory: data.inventory.filter(i => i.h >= 4).length,
    support: 9,
    campaigns: 3,
    notifications: 0,
  };

  const onAck = (rank) => setAcked(prev => prev.includes(rank) ? prev : [...prev, rank]);
  const onDismiss = (rank) => setDismissed(prev => [...prev, rank]);
  const onRefresh = () => { setExpanded(null); setTick(t => t + 1); };

  // JSON contract
  const jsonData = {
    snapshot_id: "snap_2026-04-28_T+02:14:08",
    drop: data.launch.code,
    generated_at: "2026-04-28T14:32:08Z",
    confidence: 0.86,
    actions: filteredActions.map(a => ({
      rank: a.rank,
      action_type: a.type,
      title: a.title,
      reason: a.reason,
      expected_impact: "preserve VIP fulfillment & SKU availability",
      confidence: a.confidence,
      owner: a.owner,
      automation_possible: a.automation,
      severity: a.severity,
      acknowledged: acked.includes(a.rank),
      evidence: a.evidence.items.reduce((acc, it) => ({...acc, [it.l.toLowerCase().replace(/\s|\./g, "_")]: it.v}), {}),
    })),
  };

  // Apply density class
  useEffect(() => {
    document.body.classList.toggle("dense", tweaks.density === "compact");
  }, [tweaks.density]);

  // Apply display font
  useEffect(() => {
    document.documentElement.style.setProperty("--display",
      tweaks.displayFont === "Space Grotesk" ? `"Space Grotesk", ui-sans-serif, system-ui` :
      tweaks.displayFont === "Fraktur" ? `"PP Editorial New", "Times New Roman", serif` :
      `"JetBrains Mono", "IBM Plex Mono", monospace`
    );
  }, [tweaks.displayFont]);

  return (
    <>
      {tweaks.grain && <div className="grain" />}
      <div className="app">
        <Topbar
          launch={data.launch}
          onExport={() => setJsonOpen(true)}
          onRefresh={onRefresh}
        />
        <Sidebar route={route} setRoute={setRoute} counts={counts} />
        <main className="main" key={route + tick}>
          {route === "overview" && (
            <OverviewPage
              data={{...data, actions: filteredActions}}
              expanded={expanded} setExpanded={setExpanded}
              acked={acked} onAck={onAck} onDismiss={onDismiss}
              onOpenJson={() => setJsonOpen(true)}
            />
          )}
          {route === "actions" && (
            <ActionQueuePage
              data={{...data, actions: filteredActions}}
              expanded={expanded} setExpanded={setExpanded}
              acked={acked} onAck={onAck} onDismiss={onDismiss}
            />
          )}
          {route === "orders" && <OrdersRiskPage data={data} />}
          {route === "inventory" && <InventoryPage data={data} />}
          {route === "support" && (
            <StubPage
              kicker="Soporte · escalado"
              title="Escalado de soporte"
              lead="Tickets priorizados por urgencia, sentimiento y vínculo VIP. La respuesta sugerida se redacta en línea con el tono de marca."
              items={[
                { kicker: "TICKET #4821", title: "M. Vázquez — pedido extraviado", body: "VIP top-50 · LTV €4,820 · sentimiento -0.82 · 2h 04m sin respuesta. Riesgo de mención pública en X.", tone: "crit", badge: "URGENT", color: "var(--red)", actions: [{label:"Open ticket", primary: true}, {label:"Send draft"}, {label:"Escalate"}] },
                { kicker: "CLUSTER iOS", title: "4 tickets — checkout Apple Pay", body: "iOS 17.4 / Safari · 38 sesiones afectadas · revenue blocked ≈ €5,640. Patrón confirmado por logs.", tone: "hot", badge: "BUG", color: "var(--amber)", actions: [{label:"Bulk respond", primary: true}, {label:"Notify Eng"}] },
                { kicker: "SIZE ISSUE", title: "3 tickets — talla M HOODIE-BLK", body: "Cluster con solución estándar T-04. Reembolso parcial 30% + crédito tienda ya pre-aprobado.", tone: "info", badge: "AUTO", color: "var(--blue)", actions: [{label:"Auto-resolve", primary: true}, {label:"Review"}] },
                { kicker: "SHIPPING", title: "12 tickets — ETA & express", body: "Cola de consultas sobre fechas. Se sugiere respuesta canned con tracking actualizado por carrier secundario.", tone: "info", badge: "BATCH", color: "var(--blue)", actions: [{label:"Send batch", primary: true}] },
              ]}
            />
          )}
          {route === "campaigns" && (
            <StubPage
              kicker="Campañas · riesgo"
              title="Riesgo de campañas"
              lead="Sobre-presión comercial. Cada campaña se contrasta contra disponibilidad de stock, ciudad objetivo y conversión real."
              items={[
                { kicker: "CMP-778", title: "Madrid · HOODIE-BLK", body: "Empujando 14× tráfico sobre SKU con 7 u. disponibles. ETA agotamiento: 11 minutos.", tone: "crit", badge: "PAUSE", color: "var(--red)", actions: [{label:"Pause now", primary: true}, {label:"Lower budget"}] },
                { kicker: "CMP-651", title: "Barcelona · prendas crema", body: "CTR -38%, CPA 2.4× sobre objetivo. Frecuencia 5.2. Audiencia saturándose.", tone: "hot", badge: "LIMIT", color: "var(--amber)", actions: [{label:"Cap to 60%", primary: true}, {label:"Pause"}] },
                { kicker: "CMP-771", title: "Nacional · brand", body: "Spend 78% del cap, ROAS 3.8 estable. Re-evaluar en T+03:00.", tone: "info", badge: "MONITOR", color: "var(--blue)", actions: [{label:"Set alert", primary: true}] },
                { kicker: "CMP-769", title: "Valencia · accesorios", body: "Performance dentro de banda. Sin acción inmediata.", tone: "ok", badge: "OK", color: "var(--green)", actions: [{label:"Open report"}] },
              ]}
            />
          )}
          {route === "notifications" && (
            <StubPage
              kicker="Actividad · timeline"
              title="Notificaciones"
              lead="Stream completo de eventos: snapshots, alertas, acciones creadas, acks, envíos a Telegram."
              items={data.alerts.slice(0, 6).map((a) => ({
                kicker: `T+${a.time}`,
                title: a.txt,
                body: `Origen: ${a.src}. Estado: ${a.isNew ? "new" : "sent"}.`,
                tone: a.sev,
                badge: a.sev.toUpperCase(),
                color: a.sev === "crit" ? "var(--red)" : a.sev === "hot" ? "var(--amber)" : a.sev === "info" ? "var(--blue)" : "var(--green)",
                actions: [{label: "Ver"}, {label: "Reenviar", primary: false}],
              }))}
            />
          )}
        </main>
      </div>

      <JsonDrawer open={jsonOpen} onClose={() => setJsonOpen(false)} data={jsonData} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Visual">
          <TweakRadio label="Densidad" value={tweaks.density} onChange={(v) => setTweak("density", v)}
            options={[{value:"comfortable", label:"Cómoda"},{value:"compact", label:"Compacta"}]} />
          <TweakSelect label="Tipografía display" value={tweaks.displayFont} onChange={(v) => setTweak("displayFont", v)}
            options={[{value:"Space Grotesk", label:"Space Grotesk"},{value:"Fraktur", label:"PP Editorial"},{value:"Mono", label:"Mono display"}]} />
          <TweakToggle label="Textura de grano" value={tweaks.grain} onChange={(v) => setTweak("grain", v)} />
        </TweakSection>
        <TweakSection title="Demo">
          <TweakRadio label="Modo" value={tweaks.demoMode} onChange={(v) => setTweak("demoMode", v)}
            options={[{value:"tense", label:"Tensión"},{value:"calm", label:"Todo OK"}]} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
