# Frontend Brief - Scuffers AI Ops Control Tower

## Objetivo del documento

Este documento esta pensado para pasarselo a un agente de diseno / frontend para que defina y ejecute la experiencia visual completa del producto web.

La herramienta debe sentirse:

- premium
- streetwear
- ejecutiva
- tensa y viva como un lanzamiento real
- clara para demo y para operacion

No queremos un dashboard SaaS generico. Queremos una control tower con caracter de marca.

## Contexto del reto

Scuffers esta lanzando una coleccion capsula con unidades limitadas. Durante las primeras horas puede haber:

- mucha demanda
- poco stock
- tickets urgentes
- clientes importantes en riesgo
- campanas empujando demasiado

La web debe ayudar a responder una sola pregunta:

> Que deberia hacer ahora mismo el equipo de operaciones?

La solucion final mostrara un maximo de 10 acciones priorizadas, con explicacion y evidencia.

## Norte de diseno

La interfaz debe mezclar dos universos:

1. Streetwear editorial premium
2. War room operativo

No es una tienda ecommerce. Es la sala de control interna de la marca.

Sensacion deseada:

- alto contraste
- ritmo rapido
- confianza
- criterio
- control
- lujo sobrio

## Referencias de marca y tono

Tomar como inspiracion el look actual de Scuffers y su territorio visual:

- monocromia dominante
- base oscura o neutra muy cuidada
- uso de tonos ecru, negro, gris, navy y verdes / naranjas puntuales
- energia de limited drop
- mezcla de limpieza minimal con tension urbana

No copiar la tienda. Traducir ese lenguaje a una herramienta interna.

## Perfil de usuario

La web esta pensada para:

- Operations Lead
- Support Lead
- Logistics / Fulfillment Lead
- Founder / jurado en demo

Todos deben entender el estado del lanzamiento en menos de 15 segundos.

## Principios UX

1. La prioridad manda. Todo debe ordenarse por importancia real.
2. Cada alerta debe responder "que pasa", "por que importa" y "que hago ahora".
3. Las acciones deben verse ejecutables, no solo descriptivas.
4. La explicabilidad debe estar integrada en la UI, no escondida.
5. La demo debe poder navegarse rapido y con mucho impacto visual.

## Direccion visual

### Personalidad visual

- editorial
- premium
- robusta
- sobria
- con puntos de energia

### Lo que si queremos

- grandes titulares
- bloques de informacion claros
- tarjetas con jerarquia fuerte
- fondos con textura suave o gradientes atmosfericos
- labels pequenos tipo consola / control room
- contrastes medidos

### Lo que no queremos

- UI morada por defecto
- glassmorphism generico
- widgets anonimos
- tablas grises sin narrativa
- exceso de colores simultaneos

## Sistema de color sugerido

Si no existe brand book oficial accesible, usar esta aproximacion:

- `--bg-0`: `#0B0B0C` fondo principal
- `--bg-1`: `#141416` superficie
- `--bg-2`: `#1B1C20` superficie elevada
- `--line`: `#2A2C31` bordes
- `--text-0`: `#F3EEE5` texto principal
- `--text-1`: `#B7B1A8` texto secundario
- `--bone`: `#E9DFCF` tono editorial
- `--navy`: `#20324A` tono de marca auxiliar
- `--green`: `#5EA86B` stock sano / confirmacion
- `--amber`: `#FF9D2E` warning
- `--red`: `#E4574F` critical
- `--blue`: `#4A86B8` informativo

Uso del color:

- el color no decora; informa
- rojo solo para riesgo real
- verde solo para control / resolucion
- amber para tension, nunca para exito
- navy y bone para dar caracter de marca

## Tipografia

Evitar Inter, Roboto, Arial y system stack por defecto.

Propuesta:

- Display / headings: `Space Grotesk`
- Body: `IBM Plex Sans`
- Labels / data / micro UI: `IBM Plex Mono`

Uso tipografico:

- Titulares cortos, contundentes, en gran tamano
- Labels pequenos en mayusculas espaciadas
- Datos numericos con monospace donde aporte claridad

## Layout general

### Desktop

Estructura recomendada:

- sidebar izquierda compacta
- top bar con snapshot del lanzamiento
- columna principal para top actions y panorama
- rail derecho o drawer contextual para alertas y detalle

### Mobile

No intentar replicar todo.

Priorizar:

- top actions
- resumen ejecutivo
- alertas recientes
- detalle de una accion

Usar cards apiladas y bottom sheet para detalle.

## Arquitectura de pantallas

### 1. Overview / Launch Control

Pantalla principal y mas importante.

Debe incluir:

- hero operativo con estado del lanzamiento
- modulo `Top 10 Actions Now`
- resumen ejecutivo generado por IA
- KPIs de tension
- radar de riesgo por dominio
- stream de alertas recientes

### 2. Action Queue

Vista centrada en las acciones priorizadas.

Cada tarjeta debe mostrar:

- rank
- action_type
- titulo
- motivo corto
- confianza
- owner sugerido
- impacto esperado
- evidencia resumida
- CTA visual de accion

### 3. Orders Risk

Vista para analizar pedidos comprometidos.

Elementos:

- tabla / lista de pedidos en riesgo
- chips de riesgo
- filtro por status, ciudad, shipping, VIP
- detalle de pedido con razones del score

### 4. Inventory Pressure

Vista de inventario y tension por SKU.

Elementos:

- heatmap o list view de stock pressure
- unidades disponibles
- incoming ETA
- sell through
- page views
- conversion
- colision con campanas

### 5. Support Escalation

Vista de tickets priorizados.

Elementos:

- urgencia
- sentimiento
- cliente
- pedido asociado
- recomendacion de respuesta o escalado

### 6. Campaign Risk

Vista para detectar sobrepresion comercial.

Elementos:

- campana
- ciudad objetivo
- SKU objetivo
- intensidad
- trafico
- riesgo para inventario
- recomendacion: monitor, limitar o pausar

### 7. Notifications / Activity

Timeline de eventos operativos:

- snapshots
- alertas lanzadas
- acciones creadas
- acciones reconocidas
- envios a Telegram

## Componentes clave

### KPI Ribbon

Fila superior con 4-6 KPI muy legibles:

- active risks
- critical SKUs
- urgent tickets
- VIPs impacted
- campaigns under review
- confidence score

### Action Card

Componente estrella.

Debe tener:

- ranking grande y visual
- titulo accionable
- semaforo de severidad
- razon en 1-2 lineas
- evidencia en pills
- CTA principal

### Risk Pill

Chips cortos como:

- `VIP`
- `urgent ticket`
- `stock < 3`
- `express`
- `campaign overload`

### Evidence Panel

Panel desplegable con:

- inputs usados
- score resumido
- por que subio al top 10
- notas de calidad del dato

### Alert Feed

Lista cronologica con:

- icono de severidad
- texto corto
- hora
- origen
- estado `new`, `sent`, `acked`

### JSON Export Drawer

Panel legible donde se vea el JSON final del reto con opcion de copiar.

## Jerarquia visual de severidad

Definir un sistema muy claro:

- `critical`: fondo oscuro + borde rojo + badge fuerte
- `high`: borde amber + highlight parcial
- `medium`: azul / gris con menos peso
- `resolved`: tono verde apagado

La prioridad debe leerse aunque el usuario no lea el texto.

## Microinteracciones

Usar pocas, pero con intencion.

- stagger sutil al cargar top actions
- pulse muy leve en alertas nuevas
- expand/collapse suave en panel de evidencia
- cambio de estado claro cuando una accion se reconoce

Nada demasiado jugueton.

## Tono del copy

El copy debe sonar:

- operativo
- directo
- inteligente
- no dramatico

Ejemplos:

- bien: `Pausar CMP-778 antes de agotar HOODIE-BLK-M en Madrid`
- mal: `Se detecto una posible situacion a revisar`

## Explicabilidad en interfaz

Cada accion debe responder en pantalla:

- que esta pasando
- por que es prioritario
- que impacto tendria actuar
- que datos lo justifican

La explicabilidad no debe ir a una pagina secundaria perdida.

## Responsive y accesibilidad

### Responsive

- desktop first para la demo
- mobile funcional, no de compromiso
- evitar tablas anchas imposibles en movil
- usar drawers y stacks

### Accesibilidad

- contraste AA minimo
- foco visible
- no depender solo del color
- iconos siempre acompannados de texto o label
- tipografia minima legible

## Handoff tecnico para implementacion

El frontend se implementara sobre Next.js + Tailwind.

Pedir al agente de diseno:

- definir tokens CSS
- proponer layout shell reusable
- listar componentes reutilizables
- especificar estados `loading`, `empty`, `error`, `success`
- entregar clases / estructura listas para React

## Contratos visuales con backend

La UI debe asumir al menos estas entidades:

- `Action`
- `Alert`
- `KpiSnapshot`
- `OrderRisk`
- `InventoryRisk`
- `TicketRisk`
- `CampaignRisk`

Una `Action` debe poder mostrar:

- `rank`
- `actionType`
- `targetId`
- `title`
- `reason`
- `expectedImpact`
- `confidence`
- `owner`
- `automationPossible`
- `severity`
- `evidence[]`

## Demo story recomendada

La pantalla principal debe soportar este relato:

1. "Este es el estado actual del lanzamiento."
2. "Estas son las 10 decisiones mas importantes ahora mismo."
3. "Aqui se ve por que cada una esta arriba."
4. "Y si no estamos mirando la web, Telegram nos avisa."

## Criterio final

Si hay que sacrificar algo, sacrificar profundidad visual secundaria antes que:

- claridad del top 10
- legibilidad de la severidad
- trazabilidad de evidencia
- impacto visual de la overview

La homepage debe ganar la demo por si sola.
