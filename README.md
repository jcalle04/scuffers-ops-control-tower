# Scuffers AI Ops Control Tower

Dashboard operativo para la hackathon de Scuffers.

## Problema

El reto consiste en ayudar al equipo de operaciones de Scuffers a tomar decisiones durante un lanzamiento en vivo usando varias fuentes de datos reales:

- pedidos
- clientes
- inventario
- tickets de soporte
- campañas de marketing

La salida debe priorizar como maximo `10 acciones`, con criterio de negocio, explicabilidad y foco operativo.

Durante el desarrollo, el enunciado incorporo una novedad importante: una `Shipping Status API` externa que devuelve el estado logistico real de cada pedido. La solucion no debia rehacerse, sino adaptarse en caliente para enriquecer la priorizacion.

## Solucion

La propuesta implementada es una `control tower` operativa: una aplicacion web que no se limita a visualizar datos, sino que sintetiza riesgo, evidencia y accion recomendada.

La app:

- ingesta los CSV del caso
- normaliza formatos y datos incompletos
- calcula riesgo por pedido, SKU, ticket y campaña
- consulta la `Shipping Status API` solo para pedidos relevantes
- reordena prioridades cuando detecta retrasos, incidencias o revision manual
- expone un dashboard visual para demo y varias APIs internas para consumo externo

## Que aporta

- `Top 10 Actions Now` con ranking explicable
- radar de riesgo por dominio
- detalle de pedidos con tracking real, ETA, delay risk y manual review
- presion de stock y conflicto con campañas
- feed de alertas y export de acciones
- persistencia local preparada para demo rapida

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- persistencia local en JSON

## Arquitectura

El flujo principal es:

`CSV ingest -> normalizacion -> scoring -> enrichment con shipping API -> sintesis de acciones -> snapshot persistido -> dashboard + APIs`

Piezas clave:

- [src/lib/ops/engine.ts](./src/lib/ops/engine.ts)
- [src/lib/ops/service.ts](./src/lib/ops/service.ts)
- [src/lib/shipping/shipping-status.ts](./src/lib/shipping/shipping-status.ts)
- [src/components/control-tower-dashboard.tsx](./src/components/control-tower-dashboard.tsx)

## APIs incluidas

- `/api/health`
- `/api/dashboard/overview`
- `/api/actions/top`
- `/api/orders/risks`
- `/api/inventory/pressure`
- `/api/tickets/priority`
- `/api/campaigns/risks`
- `/api/notifications/feed`
- `/api/export/top-actions`
- `/api/compute/rebuild`

## Variables de entorno

Ver [.env.example](./.env.example)

Variables principales:

- `SCUFFERS_DATASET_DIR`
- `SCUFFERS_CANDIDATE_ID`
- `SCUFFERS_SHIPPING_STATUS_API_BASE_URL`
- `SCUFFERS_SHIPPING_STATUS_RELEVANT_LIMIT`
- `SCUFFERS_SHIPPING_STATUS_TIMEOUT_MS`

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir:

- [http://localhost:3000](http://localhost:3000)

## Regenerar snapshot

```bash
npm run snapshot:rebuild
```

## Verificaciones realizadas

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run snapshot:rebuild`

## Notas

- La carpeta `Design/` contiene la referencia visual usada para adaptar la interfaz final.
- El bot de Telegram vive en un workspace separado, pero este proyecto deja preparado el feed de notificaciones y la documentacion de cambios operativos para integrarlo.
