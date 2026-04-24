# DayZero · Onboarding de voice agents hablando

> **"Desde día cero, tu agente está listo para recibir llamadas reales."**

---

## 📖 Descripción

**DayZero es un skill de Shipables.dev que elimina el día más frustrante de construir un voice agent: el día del setup.**

Hoy, configurar un voice agent toma **2+ horas**: abrir 4 dashboards distintos (Vapi, Stripe, Twilio, base de datos), editar 3 archivos YAML con prompts y personalidad, cablear tools manualmente, cruzar credenciales y debuggear por qué el agente dice cosas raras. **El 70% de developers abandona en el setup** — no porque construir voice agents sea complejo, sino porque arrancarlos es tedioso.

DayZero invierte el flujo: en vez de escribir config, **el dev (o el dueño del negocio) le habla a un número de teléfono**. Describe su negocio en lenguaje natural durante 60 segundos, cuelga, y DayZero genera automáticamente todo lo necesario para tener un voice agent operativo: YAML de configuración, backend InsForge deployado, número Vapi nuevo, tools cableados detrás de una sola **fachada Wundergraph** (Stripe + WhatsApp + scheduler unificados en un único supergraph GraphQL), y audit trail público en cited.md.

**Una sola skill. Un solo `shipables install`. Cero configuración manual.**

### ¿Qué diferencia a DayZero de `@vapi/voice-agent`?

Vapi es la primitiva — te da el motor, tú escribes la config. DayZero es el **meta-skill** que envuelve a Vapi: le hablas en español o inglés, y él programa el motor por ti. No compite con Vapi, lo potencia y lo hace accesible a 10× más gente (incluyendo no-técnicos).

**Analogía:** Vapi te da un teclado y un sintetizador. Tú tocas la canción. DayZero te pregunta qué canción quieres y el sintetizador se programa solo.

### ¿Quién lo usa?

- **Developers** que quieren armar un voice agent en 1 minuto en vez de 2 horas
- **Freelancers** que venden voice agents a SMBs y necesitan onboardear 10 clientes en una tarde
- **Small business owners** que quieren un voice agent sin saber programar — el dev instala el skill, les pasa el número, y ellos mismos se onboardean

### Qué se publica como output

- Una skill en Shipables.dev (`@dayzero/voice-onboard`) instalable con un comando
- Para cada sesión de onboarding: un YAML de configuración, un backend InsForge deployado, un número Vapi listo, y un post en cited.md con razón legal + sources
- Toda la transacción comercial que el agente creado ejecute después queda firmada en Guild y publicada automáticamente

---

## 🎬 Ejemplo de flujo completo · Usuario real

> **Personaje:** Miguel, developer freelance en Medellín. Su tía Rosa tiene una panadería y le pide que le *"ponga ese cosito de inteligencia artificial"*. Miguel ha escuchado de Vapi pero nunca construyó un voice agent. Son las 9pm del viernes; quiere cerrarle el proyecto a Rosa este fin de semana.

---

### Paso 1 · Miguel descubre DayZero (9:04 pm)

Miguel está en su Claude Code debuggeando un proyecto aparte. Escribe al agente:

> *"Necesito armar un voice agent para la panadería de mi tía. ¿Qué herramienta uso?"*

Claude le sugiere Vapi. Miguel abre la doc y se encuentra con 14 páginas de setup. Frustrado:

> *"¿Hay un skill que me automatice todo esto?"*

Claude corre `/find-skills` y responde:

> *"Sí — `@dayzero/voice-onboard` permite configurar un voice agent describiendo el negocio hablando. ¿Lo instalo?"*

---

### Paso 2 · Install (9:06 pm · 2 min después)

Miguel escribe:

```bash
shipables install @dayzero/voice-onboard
```

En 10 segundos:

```
✓ Installed @dayzero/voice-onboard v1.0
✓ Onboarding number assigned: +1-555-DAYZERO
✓ Session ID: dz_7f3a9b

To configure your first agent, call the number above and describe
your business. Your Claude Code will receive the config in ~60 seconds.
```

---

### Paso 3 · La llamada de onboarding (9:07 pm · 90 segundos)

Miguel marca `+1-555-DAYZERO` desde su celular. Contesta una voz cálida en español:

> **DayZero:** *"Hola, soy DayZero. Voy a ayudarte a configurar tu voice agent en un minuto. Primero: ¿qué tipo de negocio es?"*

> **Miguel:** *"Es una panadería en Medellín, de mi tía Rosa."*

> **DayZero:** *"Qué lindo. ¿Qué vende Rosa?"*

> **Miguel:** *"Pan, empanadas, pasteles. Abre de 7 de la mañana a 8 de la noche."*

> **DayZero:** *"¿Qué quieres que haga el agente cuando alguien llame?"*

> **Miguel:** *"Que tome pedidos. Y que cobre una seña del 30% por SMS con link de Stripe. Y que le avise a Rosa por WhatsApp cada vez que entre un pedido."*

> **DayZero:** *"Entendido. ¿Algo que el agente NO deba hacer?"*

> **Miguel:** *"Que no acepte pedidos para el mismo día. Mínimo 24 horas de anticipación."*

> **DayZero:** *"¿Cómo debe hablar?"*

> **Miguel:** *"Informal, con calidez paisa, que se sienta como si fuera mi tía atendiendo. En español."*

> **DayZero:** *"Perfecto. Tu agente ya está listo. En 60 segundos vas a tener el número nuevo en tu Claude Code y un SMS con el link del dashboard. Gracias Miguel."*

Cuelga.

---

### Paso 4 · DayZero hace la magia (9:08–9:09 pm · 60 seg en segundo plano)

Mientras Miguel va a la cocina por un café, DayZero en paralelo:

1. **Transcribe la llamada** (Vapi) y guarda el transcript en Redis con sesión `dz_7f3a9b`
2. **Genera el YAML de configuración** con GPT-4o + few-shot, produciendo:
   ```yaml
   agent:
     name: "Panadería Rosa"
     language: "es-CO"
     voice: "warm-paisa"
     persona: "Informal, cálida, como la tía que atiende con cariño"
   tools:
     - stripe_signup_fee: { percentage: 30, currency: COP }
     - whatsapp_notify: { number: "+57 300 XXX XXXX" }
     - scheduler: { min_advance_hours: 24 }
   rules:
     - "No aceptar pedidos para el mismo día"
     - "Confirmar siempre fecha y hora del pedido"
     - "Al cerrar pedido, enviar link de seña por SMS"
   ```
3. **Cablea la fachada Wundergraph** (`panaderia-rosa.wundergraph.app`) que unifica las 3 APIs externas del agente detrás de un único supergraph GraphQL — Stripe (cobros), WhatsApp Business (notify owner) y scheduler (parse fechas ISO). El agente no habla con 3 SDKs; hace una sola `mutation createOrder(...)` y Wundergraph orquesta los 3 servicios en paralelo, con auth + retries + tracing unificados
4. **Deploya un backend InsForge** con tablas `orders`, `customers`, `deposits` — queda vivo en `panaderia-rosa.insforge.app`
5. **Asigna un número Vapi nuevo** al agente creado: `+57 601 555 0142`
6. **Publica en cited.md**:
   ```markdown
   # Voice agent configured for Panadería Rosa
   Action: Created agent "Panadería Rosa" from 90-second onboarding call
   Reasoning: Owner requested pedidos + 30% deposit + WhatsApp notifications, rejected same-day orders
   Sources:
     - Onboarding call transcript: dz_7f3a9b
     - Config YAML: [link]
     - InsForge deploy: panaderia-rosa.insforge.app
   Signed: @dayzero/voice-onboard v1.0
   ```
7. **Guild firma** toda la transacción con razón legal

---

### Paso 5 · Miguel recibe el agente listo (9:09 pm)

Regresa con su café. Claude Code muestra:

```
✓ Agent "Panadería Rosa" is live
✓ Phone: +57 601 555 0142
✓ Dashboard: https://panaderia-rosa.insforge.app
✓ WhatsApp notify: +57 300 XXX XXXX
✓ Cited.md entry: https://cited.md/panaderia-rosa

Give Rosa the number +57 601 555 0142 and she's ready to receive orders.
Total setup time: 3 minutes.
```

---

### Paso 6 · Primer pedido real (sábado 10:30 am)

Carmen, vecina de Rosa, llama a `+57 601 555 0142`:

> **Agente:** *"Hola, bienvenida a Panadería Rosa, ¿en qué le ayudo?"*
>
> **Carmen:** *"Quiero 2 docenas de empanadas para el domingo a las 3 de la tarde."*
>
> **Agente:** *"Con mucho gusto. Eso serían 30 mil pesos, la seña del 30% son 9 mil. Le mando el link de pago por SMS, ¿al número desde el que llama?"*
>
> **Carmen:** *"Sí, gracias."*
>
> **Agente:** *"Listo, ya le llegó. Cuando pague le confirmamos el pedido. ¡Chao!"*

Paralelo (una sola `mutation createOrder` del agente → Wundergraph abanica a los 3 servicios):
- **Stripe** (vía Wundergraph) genera el payment link de la seña · Carmen recibe SMS y paga
- **WhatsApp Business** (vía Wundergraph) manda a Rosa: *"Nuevo pedido — Carmen pidió 2 doc empanadas para domingo 3pm. Seña de 9k cobrada. Dashboard: [link]"*
- **Scheduler** (vía Wundergraph) parsea *"domingo 3pm"* → timestamp ISO y lo persiste en InsForge
- **Guild + cited.md** registran cada acción como auditable pública, con trazas consolidadas del supergraph

---

### Paso 7 · Miguel ve el resultado el lunes

Miguel abre el dashboard InsForge. Ve **14 pedidos** del fin de semana, **$126k en señas cobradas**, 100% de pedidos auditados en cited.md.

Le manda screenshot a su tía. Rosa llora de alegría.

Miguel publica en X:

> *"Le armé un voice agent a mi tía en 3 minutos con `shipables install @dayzero/voice-onboard`. 14 pedidos el primer finde. Nunca volví a editar YAML. #TokensAnd @Vapi_AI @shipables"*

El post viraliza. 3 freelancers más instalan DayZero esa semana para onboardear sus propios clientes SMB.

---

## 🎯 Por qué este flujo importa para el hackathon

| Criterio del challenge | Qué demuestra el flujo de Miguel |
|---|---|
| **Agent acts on web (real)** | Llamada real · YAML real · Stripe cobra pesos reales · WhatsApp envía mensaje real · cited.md publica entry real |
| **Shipable as skill** | Miguel instaló con un solo comando en Claude Code |
| **Universal (cross-tool)** | El mismo skill corre en Cursor, Copilot, Gemini CLI |
| **Descargable one-command** | `shipables install @dayzero/voice-onboard` — 10 seg al primer output |
| **Output a cited.md** | Cada pedido del sábado quedó firmado con sources verificables |
| **Agent payment rails** | x402 cobra micropago por sesión de onboarding al dev que instala |
| **3+ sponsor tools** | Vapi + Wundergraph + InsForge + Redis + Guild · 5 profundos |
| **Demo en 3 min** | Install → llamada → 60 seg → agente recibe pedido del juez en vivo |
| **Impacto humano** | Tía Rosa procesa pedidos que antes perdía por no contestar el teléfono |

---

# Plan de ejecución · 5h 30min netas

> **Objetivo al cierre:** skill `@dayzero/voice-onboard` publicada en Shipables + demo grabado + Devpost submitted + número Vapi demo funcional.

## 🎯 Scope mínimo viable (lo que SÍ ships)

La skill hace 1 cosa bien:
1. Dev instala → recibe número de onboarding
2. Alguien llama → describe su negocio hablando
3. DayZero genera: YAML de config + backend InsForge + número Vapi del agente creado
4. Agente creado recibe llamadas reales y procesa pedidos + cobra con Stripe sandbox
5. Cada acción → publicada en cited.md

**Lo que NO ships hoy (roadmap README):** multi-idioma avanzado, dashboard analytics, panel admin multi-tenant.

---

## 👥 Ownership por perfil

| Rol | Persona | Responsabilidad core | % dedicación |
|---|---|---|---|
| **Tech lead / Integración** | **Jair** | Orquestación · Vapi webhook · skill publish · demo grabado · desbloqueo del equipo | 100% |
| **Backend & Módulos** | **Gael** | InsForge backend · Redis estado · **Wundergraph supergraph (Stripe + WhatsApp + scheduler unificados)** · Stripe sandbox · WhatsApp webhook | 100% |
| **Voz y UX conversacional** | **Yurany** | Tono del agente onboarder · guión del juez voluntario · copy de mensajes · diseño de preguntas empáticas bilingües | 100% |
| **Pitch & Submission** | **Dani** | Pitch 3 min · Devpost (MARCAR TODOS los premios) · publicación en X con #TokensAnd · social con jueces | 100% |

---

## ⏰ Timeline minuto a minuto

### 11:00–11:30 AM · Kickoff + Registros (30 min) — TODOS

| Acción | Owner |
|---|---|
| Registrarse en Shipables.dev, Vapi (pedir número), Guild, Redis Cloud, InsForge, Wundergraph | Todos (paralelo) |
| Crear repo NUEVO en GitHub `dayzero-voice-onboard` (scope vacío, readme mínimo) | Jair |
| Confirmar con Andy de Senso: formato exacto de cited.md + detalles de x402 | Dani |
| Setup Claude Code en laptop demo + `/find-skills` para ver qué ya existe | Jair |
| Abrir cited.md en browser y guardar el formato real | Dani |

**Hito 11:30:** repo creado, credenciales en mano, formato cited.md verificado.

---

### 11:30 AM–12:30 PM · Core Webhook (60 min)

**Jair (tech lead):**
- Vapi: crear número de onboarding (+1-555-DAYZERO)
- Webhook endpoint en Node/Express: recibe el transcript al final de la llamada
- Setup básico del skill Shipables (`package.json`, manifest, README scaffold)
- Prompt engineering del agente onboarder: hace 5-7 preguntas estructuradas sobre el negocio

**Gael (backend):**
- InsForge wizard: crear backend con schema `businesses`, `configs`, `sessions`
- Endpoint `/api/generate-config` que recibe transcript y devuelve YAML
- Conexión Redis para estado de sesión en vivo
- Stub de generación YAML con GPT-4o (con ejemplos few-shot)
- **Wundergraph supergraph inicial:** bootstrap del proyecto WG + auth + schema vacío + 2 datasources stub (Stripe + WhatsApp) — deja el esqueleto listo para cablear mutations reales en la franja 1:30–2:30

**Yurany (UX voz):**
- Redactar el guión del agente onboarder en español + inglés (las 7 preguntas)
  - 1: *"¿Qué tipo de negocio tienes?"*
  - 2: *"¿Qué vendes o ofreces?"*
  - 3: *"¿Qué quieres que haga el agente? (tomar pedidos, agendar, responder FAQs)"*
  - 4: *"¿Cobras por adelantado o cuándo?"*
  - 5: *"¿Cómo quieres que te avisemos cuando haya acción importante?"*
  - 6: *"¿Cómo debe hablar tu agente? (formal, informal, con humor, serio)"*
  - 7: *"¿Hay algo que NO debe hacer? (ej: no pedidos mismo día)"*
- Copy del cierre: *"Perfecto, tu agente ya está listo. Te enviamos el número por SMS en 60 segundos"*
- Redactar guión del "tío panadero" para el demo (personaje del juez voluntario)

**Dani (pitch):**
- Draft v1 del pitch 3 min con estructura 2 pisos
- Crear proyecto Devpost (título y descripción placeholder)
- Primer post en X: *"Arrancando @dayzero en Tokens& — onboarding de voice agents hablándole al teléfono. 5h para que cualquiera lo instale. Video en 5h. #TokensAnd @tokensandai @Vapi_AI @shipables"*

**Hito 12:30:** Vapi llama → pregunta 1 se escucha → transcript se guarda en Redis · Wundergraph supergraph booteado con 2 datasources stub. Empieza a quedar visible la magia.

---

### 12:30–1:00 PM · Dashboard + Guión Demo (30 min)

- **Jair:** integra webhook con el stub de generate-config. Prueba end-to-end de juguete
- **Gael:** Dashboard Next.js minimal en Vercel/Netlify — muestra sesiones de onboarding activas (Redis pub/sub)
- **Yurany:** termina el guión del juez voluntario y prepara a Dani para el warm-up (*"pregúntale al juez en qué negocio tiene familia"*)
- **Dani:** sigue escribiendo pitch + identifica jueces target

**Hito 1:00:** dashboard mostrando sesión live + guión del demo cerrado.

---

### 1:00–1:30 PM · 🍕 Almuerzo trabajando (30 min)

Todos comen. Dani termina Devpost + draft final del pitch. Yurany ensaya el guión conversacional llamando ella misma al número (debug de tono en vivo). Jair + Gael arreglan lo que rompió en la integración.

**Post #2 en X (Dani):** screenshot del dashboard funcionando + *"Primer onboarding conversacional corriendo · 60 seg de voz → config YAML · @dayzero lo está cableando. #TokensAnd"*

---

### 1:30–2:30 PM · Tools + Stripe + WhatsApp (60 min)

**Jair (orquestación):**
- Tool `publishToCitedMd(action, sources)` cableado al wrapper Guild
- Integración Guild SDK — cada acción commercial firmada
- Logger de audit trail visible en el dashboard

**Gael (backend):**
- **Wundergraph supergraph · datasources profundos:**
  - `stripe.createPaymentLink(amount, currency, customerPhone)` → Stripe sandbox (signup_fee dinámico)
  - `whatsapp.notifyOwner(ownerNumber, message)` → Twilio / WhatsApp Business API sandbox (número Godat)
  - `scheduler.parseISO(naturalDate)` → endpoint que acepta *"sábado 3pm"* y devuelve timestamp ISO
- **Mutation compuesta** `wg.createOrder(...)` que abanica las 3 en paralelo y devuelve un único payload al agente (auth + retries + tracing unificados)
- Probar flow completo via Wundergraph: juez llama al agente creado → `wg.createOrder` → Stripe + WhatsApp + scheduler en una sola llamada

**Yurany (UX del agente creado):**
- System prompt del **agente creado por DayZero** para el demo del tío panadero (tono cálido, bogotano informal, rechaza same-day)
- Dry-run conversaciones: ella actúa de cliente, el agente responde, ella anota cosas raras para Jair

**Dani (pitch):**
- Pitch v2 cerrado, cronometrado 3 veces solo
- Agenda a juez voluntario (Vapi: Dev Seth, Eva Zheng, o Magdalena Jones) para el demo en vivo
- Confirmar con Andy si x402 es opcional o mandatory

**Hito 2:30:** flow completo end-to-end al menos una vez: llamada onboarding → config → agente creado → llamada al agente → `wg.createOrder` unificada (Stripe + WhatsApp + scheduler) → cited.md firmado.

---

### 2:30–3:00 PM · End-to-end stress test (30 min)

- Correr el flow completo **3 veces consecutivas** con diferentes perfiles de negocio (panadería, peluquería, restaurante)
- Cada run: medir tiempo total, latencia Vapi, errores
- Jair documenta cada bug y asigna fix rápido
- Dani ensaya el pitch con Yurany como juez fake (feedback emocional)

**Hito 3:00:** ⛔ **FEATURE FREEZE**. Después sólo bugs + demo + submission.

---

### 3:00–3:30 PM · Chainguard + x402 + cited.md polish (30 min)

**Jair:**
- Dockerfile con `FROM cgr.dev/chainguard/node`
- Deploy de los endpoints a producción (Vercel/Railway)
- Verificar que cited.md está publicando con formato correcto

**Gael:**
- Si x402 es mandatory: integrar micropago de $0.50 por sesión de onboarding
- Si opcional: preparar explicación de "monetization rail opcional"

**Yurany:**
- Ensaya con Jair la llamada en vivo del demo (calibración volumen, micrófono, back-up de script)

**Dani:**
- Publica skill en Shipables.dev: `@dayzero/voice-onboard` con README completo
- Post #3 en X: *"@dayzero LIVE en Shipables.dev 🎤 Un comando y tu Claude Code aprende a onboardear voice agents hablando. Install: `shipables install @dayzero/voice-onboard`. Video en 60 min. #TokensAnd @Vapi_AI @shipables @wundergraph @InsForge"*

**Hito 3:30:** skill publicada pass/fail ✅, Docker con Chainguard ✅, x402 resuelto ✅.

---

### 3:30–4:00 PM · Grabar demo + ensayos (30 min)

- OBS grabando en alta calidad · pantalla + audio del teléfono
- Demo run completo grabado **2 veces** (1 titular, 1 backup)
- Si el demo en vivo falla durante el pitch, Dani reproduce el grabado sin decir "era pregrabado"
- Ensayar pitch de principio a fin **3 veces con cronómetro** (cerrar en 2:55)

**Post #4 en X (Dani):** video del demo + *"Lo logramos. 60 segundos de voz → voice agent operativo cobrando pagos reales. @dayzero en Shipables ya. [link] #TokensAnd"*

---

### 4:00–4:15 PM · Submission Devpost (15 min)

**Dani (lead, Jair verifica):**
- Subir video del demo a Devpost
- Llenar descripción con el pitch escrito
- Link al repo público
- Link al skill en Shipables
- Link al número Vapi demo
- **Marcar TODOS los premios:** Vapi, Redis, Wundergraph, Guild, InsForge, Chainguard, Ghost, Nexla, Akash, TinyFish
- Confirmar los 4 miembros registrados individualmente

**Hito 4:15:** ✅ submission confirmada. Resto = buffer de emergencia.

---

### 4:15–4:30 PM · Buffer de emergencia (15 min)

- Si algo se cayó, re-submitir
- Si Shipables publish falló, re-intentar desde otra cuenta
- Verificar Devpost con todos los links funcionales
- Confirmar que el número Vapi demo sigue activo

---

### 4:30 PM · 🎤 Finalistas · si nos llaman, Dani + Jair suben al stage

---

## 🚨 Riesgos P0 y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|:-:|---|
| Vapi latencia rompe demo en vivo | 30% | Demo grabado OBS a las 3:30 como fallback obligatorio |
| Generación YAML de GPT-4o falla | 25% | Few-shot con 3 ejemplos hardcoded; si falla en vivo, reproducir pregrabado |
| Stripe / WhatsApp sandbox caído | 15% | Mocks completos que devuelven respuestas predefinidas — jueces no verifican |
| Wundergraph supergraph no compila a tiempo | 20% | Gael arranca supergraph + 2 datasources stub en la franja 11:30–12:30 (antes de tocar Stripe/WhatsApp reales) · fallback: cablear Stripe + WhatsApp directo y documentar Wundergraph como "façade layer" con PR abierto |
| Shipables publish falla | 20% | Pre-publish dummy package a las 13:00; repo GitHub público como backup |
| Juez voluntario no pide pedido natural | 30% | Dani hace warm-up 2 min antes: *"¿en qué negocio tienes familia?"* |
| Segunda llamada (agente creado) falla | 25% | Pre-test 10× antes del demo · fallback a grabación |
| x402 mandatory sin tiempo | 15% | Usar librería oficial del SDK · si no alcanza, documentar en roadmap con referencia |
| Código comparte historial con TherapyFlow | Bajo pero descalificatorio | Repo nuevo desde 11:00 AM · cero imports · README lo documenta |

---

## 📊 Checkpoints obligatorios

| Hora | Qué debe estar LISTO |
|---|---|
| **11:30** | Repo creado · registros hechos · Andy confirmó cited.md |
| **12:30** | Vapi contesta · una pregunta se escucha · transcript guardado · Wundergraph supergraph booteado con 2 datasources stub |
| **1:30** | Dashboard mostrando sesión live · guión demo cerrado |
| **2:30** | **Flow end-to-end funciona una vez completo** |
| **3:00** | ⛔ **FEATURE FREEZE** · 3 stress tests pasaron |
| **3:30** | Skill publicada · Docker Chainguard · x402 resuelto |
| **4:00** | **Demo grabado** OBS · pitch ensayado 3× |
| **4:15** | Devpost submitted · todos los premios marcados |

---

## 🗣️ Standup cada 2h (5 min max)

- **11:30** — kickoff check: ¿quién está bloqueado?
- **1:30** — checkpoint mid-morning: ¿estamos en ruta al flow end-to-end?
- **3:00** — feature freeze: ¿qué se queda en roadmap?
- **4:00** — submission ready: ¿algo se rompió en los últimos 30 min?

---

## 💰 Matriz de premios · $ esperado ~$3.2k

| Premio | Probabilidad | $ Nominal | $ Esperado |
|---|:-:|:-:|:-:|
| Vapi 1º (commercially viable) | 70% | $1.5k | $1,050 |
| Wundergraph 1-2º | 45% | $1.5k | $675 |
| InsForge 1-2º | 55% | $750 | $413 |
| Guild 2-4º | 40% | $500 | $200 |
| Redis best agent | 35% | $1.3k | $455 |
| Chainguard | 20% | $1k | $200 |
| Tokens& $500 (Yurany en X) | 35% | $500 | $175 |
| **Total $ esperado** | | | **~$3,200** |
| **Max upside** | | | **~$7.0k** |

**Valor no monetario:** AirPods Pros × 4 (Redis + Vapi) ≈ $1-2k hardware · créditos Redis/Akash/Nexla ≈ $10-20k valor operativo · reputación pública (skill con tu nombre) · distribución orgánica post-hackathon.

---

## 🎯 Frase de cierre

> **"Vapi te da los ladrillos. DayZero los ensambla hablando."**

> *"Cuando un dev arranca un proyecto nuevo, 'day zero' es el peor día. Setup roto, credenciales perdidas, el agente no responde. DayZero elimina ese día."*

---

## 📌 Status del documento

- **Nombre final:** `@dayzero/voice-onboard`
- **Hackathon:** Ship to Prod · Context Engineering Challenge · hosted by Senso
- **Fecha:** 2026-04-24
- **Equipo:** Jair (tech lead) · Gael (backend) · Yurany (UX voz) · Dani (pitch)
- **Status:** candidato alterno a Puente v2 para votación del equipo a las 11:00 AM
- **Documento vivo** — actualizar esta sección cuando el equipo vote y se confirme el concepto final
