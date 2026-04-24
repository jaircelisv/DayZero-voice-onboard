# DayZero · Voice Agent Onboarder

> **"From day zero, your agent is ready to take real calls."**

A Shipables skill that lets anyone configure a production voice agent by **calling a phone number and describing their business in 60 seconds**. No YAML to write. No dashboards to click. Voice in. Real money out.

Built at **Tokens& 2026 · Ship to Prod** by the DayZero team (Jair, Gael, Dani, Yurany).

[![GitHub](https://img.shields.io/badge/github-jaircelisv%2FDayZero--voice--onboard-181717?logo=github)](https://github.com/jaircelisv/DayZero-voice-onboard)
[![Shipables](https://img.shields.io/badge/shipables-jaircelisv%2Fdayzero--voice--onboard-blue)](https://codeables.dev/skills/jaircelisv/dayzero-voice-onboard)
[![Live backend](https://img.shields.io/badge/heroku-live-79589F)](https://dayzero-onboard-7054-325356381078.herokuapp.com/health)

---

## What is DayZero?

Today, configuring a Vapi voice agent takes **2+ hours**: open four dashboards, edit YAML by hand, wire tools manually, cross-reference credentials, and debug why the agent says strange things. **70% of developers give up at setup** — not because building voice agents is hard, but because *bootstrapping* one is tedious.

DayZero inverts the flow: instead of writing config, **the dev (or business owner) talks to a phone number**. They describe their business in natural language for ~60 seconds, hang up, and DayZero generates everything needed to ship a working voice agent:

- A YAML config matching a strict schema
- A real Stripe (test-mode) payment link generator
- A Telegram (or WhatsApp) owner-notifier
- A `cited.md` audit entry for every action the agent takes

**One skill. One install. One phone call. Zero manual config.**

---

## Try it in 90 seconds

```bash
# 1. Install the skill in your IDE (Claude Code, Cursor, Copilot, or Gemini CLI)
shipables install jaircelisv/dayzero-voice-onboard

# 2. Run the install hook to reserve a session
bash entrypoints/install.sh

# 3. Call the onboarder number from any phone
#    +1 (443) 391 9140
#    Describe your business for 60-90 seconds. Hang up.

# 4. Materialize the generated YAML into your IDE
bash entrypoints/materializer.sh --latest

# 5. Inspect what just got created
cat dayzero/agent.yaml
```

In ~5 seconds after you hang up, you have a working voice agent config in your repo.

---

## How it differs from `@vapi/voice-agent`

Vapi is the primitive — it gives you the engine, you write the config. DayZero is the **meta-skill** that wraps Vapi: you talk to it, and it programs the engine for you. It does not compete with Vapi, it makes it accessible to 10× more people (including non-technical founders).

> **Analogy:** Vapi gives you a keyboard and a synthesizer. You play the song. DayZero asks you what song you want and the synthesizer programs itself.

---

## Architecture

```
┌─────────────────┐
│  Dev's Terminal │  shipables install jaircelisv/dayzero-voice-onboard
│  (Claude Code,  │  bash entrypoints/install.sh ─→ POST /api/sessions/reserve
│   Cursor, etc.) │                                          │
└────────┬────────┘                                          ▼
         │                                          ┌──────────────┐
         │  📞 +1 (443) 391 9140                    │  Redis Cloud │
         ▼                                          │  session:dz_*│
┌─────────────────┐    end-of-call-report    ┌─────│              │
│  Vapi onboarder │ ────────────────────────▶│      └──────────────┘
│  (GPT-4.1-mini) │   transcript + metadata  │              ▲
│  Voice: Elliot  │                          │              │
└─────────────────┘                          │              │
                                             ▼              │
                                  ┌──────────────────┐      │
                                  │ /webhook/vapi/   │ ─────┤ persist
                                  │ onboard-transcrip│      │
                                  └────────┬─────────┘      │
                                           │ POST           │
                                           ▼                │
                                  ┌──────────────────┐      │
                                  │ /api/generate-   │      │
                                  │ config           │      │
                                  │ (GPT-4o-mini)    │ ─────┤ store yaml
                                  └──────────────────┘      │
                                                            │
┌─────────────────┐    GET /api/sessions/latest-with-yaml   │
│ materializer.sh │ ─────────────────────────────────────────┤
│   --latest      │    GET /api/sessions/:id/bundle          │
└────────┬────────┘                                          │
         │ writes ./dayzero/{agent.yaml, cited.md}           │
         ▼                                                   │
┌─────────────────┐                                          │
│ Dev's IDE shows │                                          │
│ generated YAML  │                                          │
└─────────────────┘                                          │
                                                             │
┌─────────────────┐                                          │
│  Optional plus: │     POST /api/agent/:id/createOrder      │
│  curl createOrder│ ────────────────────────────────────────┤
└─────────────────┘                                          ▼
                                          ┌────────────────────────┐
                                          │  Promise.all([          │
                                          │    Stripe.prices +      │ → buy.stripe.com/test_*
                                          │    Stripe.paymentLink,  │
                                          │    Telegram sendMsg     │ → owner notification
                                          │  ])                     │
                                          └────────────────────────┘
                                                       │
                                                       ▼
                                              cited.md entry
                                              persisted in Redis
```

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Voice | **Vapi** · Deepgram (STT) · 11labs Elliot (TTS) · GPT-4.1-mini | Onboarder phone agent on `+1 (443) 391 9140` |
| Backend | **Express + TypeScript** on Heroku | Fastest path to a public HTTPS endpoint Vapi can webhook |
| Config gen | **OpenAI GPT-4o-mini** | Transcript → schema-conformant YAML |
| Storage | **Redis Cloud** (free tier) | Sessions, transcripts, orders, audit entries — sub-ms reads |
| Payments | **Stripe API** (test mode) | Real payment links generated per order |
| Notifications | **Telegram Bot API** | Owner notification — 60s setup vs 30min for Twilio sandbox |
| Distribution | **Shipables registry** | `shipables install` from any IDE |
| Hosting | **Heroku** Node buildpack | One-command deploys via `git push heroku main` |

---

## Backend endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/health` | Liveness probe |
| `POST` | `/webhook/vapi/onboard-transcript` | Receives Vapi events; validates `x-vapi-secret`; persists transcript to Redis; kicks `/api/generate-config` |
| `POST` | `/api/sessions/reserve` | Install hook reserves a `sessionId` (TTL 1h in Redis) |
| `POST` | `/api/generate-config` | GPT-4o-mini converts transcript to schema-conformant YAML; falls back to a stub if OpenAI is unavailable |
| `GET`  | `/api/sessions/latest-with-yaml` | Returns the most recent session with non-empty `yaml` (used by `materializer.sh --latest`) |
| `GET`  | `/api/sessions/:id/bundle` | Returns `{yaml, files[], citedMdEntry, agentNumber}` for the materializer |
| `POST` | `/api/agent/:agentId/createOrder` | Promise.all fanout: Stripe price + payment link, Telegram message, cited.md entry |

---

## YAML schema (what DayZero generates)

```yaml
agent:
  name: panaderia-rosa            # kebab-case identifier
  displayName: Panadería Rosa     # human-readable
  description: A bakery in Medellín that takes phone orders.
  language: "es"                  # detected from caller's language
  voice:
    provider: "11labs"
    voiceId: "Valentina"
  systemPrompt: "Hola, soy el asistente virtual de Panadería Rosa..."
  tools:
    - createOrder
    - notifyOwner
  schedule:
    hours: "Lun-Sab 7am-8pm"
    minLeadHours: 24
  payment:
    upfrontPercent: 30
    currency: "COP"
  ownerNotificationChannel:
    type: "telegram"
    chatId: "{{OWNER_TG_CHAT_ID}}"
```

---

## The `cited.md` audit trail

Every action emits a `cited.md` entry signed with sources, reasoning, and timestamps. Sample:

```markdown
## DayZero · order_created
**Timestamp:** 2026-04-24T22:40:12.607Z
**Session:** panaderia-rosa
**Reasoning:** Agent for panaderia-rosa processed an order from Carmen
for 24x empanadas, scheduled 2026-04-27 15:00. Deposit charged via
Stripe; owner notified via Telegram.

### Sources
- stripe_payment_link · ref=plink_1TPsOOJDJWbedPUR2FLEeLwa · url=https://buy.stripe.com/test_28EcN6aTj3ka1E31vgbfO00
- telegram_message · ref=5
- scheduled_at · value=2026-04-27 15:00
```

---

## Cross-tool support

The Shipables manifest declares compatibility with all four major coding agents:

| Tool | Invocation | Entrypoint |
|---|---|---|
| Claude Code | `/dayzero-onboard` | `entrypoints/claude-code/skill.md` |
| Cursor | `.mdc` rule | `entrypoints/cursor/rule.mdc` |
| GitHub Copilot | `@dayzero` chat participant | `entrypoints/copilot/chat-participant.md` |
| Gemini CLI | extension | `entrypoints/gemini-cli/extension.toml` |

This is a **requirement of the Shipables Universal challenge** at Tokens& 2026.

---

## Repository layout

```
DayZero/
├── readme.md
├── backend/                                  # Heroku-deployable Express service
│   ├── package.json + tsconfig + Procfile
│   ├── Dockerfile                            # Chainguard-hardened (not currently used)
│   ├── .env.example                          # all required env vars
│   └── src/
│       ├── server.ts
│       ├── lib/
│       │   ├── redis.ts                      # session store + pub/sub
│       │   ├── vapi-signature.ts             # webhook auth
│       │   ├── yaml-schema.ts                # GPT-4o-mini system prompt
│       │   └── cited.ts                      # cited.md entry builder
│       ├── routes/                           # 7 endpoints (see above)
│       └── types/vapi.ts
└── skill/dayzero-voice-onboard/              # Shipables skill package
    ├── SKILL.md                              # required by registry
    ├── shipables.json                        # required by registry
    ├── manifest.json                         # cross-tool compatibility matrix
    ├── prompts/
    │   └── onboarder-system-prompt.md        # bilingual ES/EN system prompt
    └── entrypoints/
        ├── install.sh                        # reserves session, prints number + ID
        ├── materializer.sh                   # polls bundle, writes ./dayzero/* files
        ├── claude-code/, cursor/, copilot/, gemini-cli/
        ├── index.js, onboard.ts, post-call.ts
```

---

## Run locally

```bash
git clone https://github.com/jaircelisv/DayZero-voice-onboard.git
cd DayZero-voice-onboard/backend

# Configure (see .env.example)
cp .env.example .env.local
# Fill in: OPENAI_API_KEY, STRIPE_SECRET_KEY (must start with sk_test_),
#         TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_CHAT_ID, REDIS_URL, VAPI_WEBHOOK_SECRET

npm install
npm run dev                                   # localhost:3000

# Expose to Vapi via tunnel
npx cloudflared tunnel --url http://localhost:3000
# Update Vapi phone number's Server URL to the tunnel URL.
```

To deploy your own instance to Heroku:

```bash
cd backend
git init -b main && git add . && git commit -m "init"
heroku create my-dayzero-backend --stack heroku-24
heroku config:set OPENAI_API_KEY=... STRIPE_SECRET_KEY=sk_test_... \
                  TELEGRAM_BOT_TOKEN=... TELEGRAM_OWNER_CHAT_ID=... \
                  REDIS_URL=redis://... VAPI_WEBHOOK_SECRET=$(openssl rand -hex 32)
git push heroku main
```

---

## Engineering decisions worth calling out

### `--latest` materializer auto-discovery
The install hook reserves a random `sessionId`. The Vapi webhook persists under `dz_${vapiCallId}`. They do not match.

**Fix:** `GET /api/sessions/latest-with-yaml` does a Redis SCAN, returns the most recent session with non-empty `yaml`. The materializer runs with `--latest` — no sessionId needed. Demo-grade (one dev at a time). Production-grade would pass the reserved sessionId into Vapi via `assistantOverrides.metadata`.

### `Promise.all` instead of Wundergraph
The original spec called for a Wundergraph supergraph unifying Stripe + WhatsApp + scheduler. Not feasible in 60 minutes. Replaced with `Promise.all([stripeCall, telegramCall])` in Node. **We did not mark the Wundergraph prize on Devpost** — honest scope for honest credit.

### Telegram instead of WhatsApp
Twilio's WhatsApp Business sandbox needs ~30 minutes of approval. Telegram bot via `@BotFather`: 60 seconds. Same demo outcome.

### Two-call Stripe payment link
`stripe.paymentLinks.create` does not accept inline `price_data`. Workaround: `stripe.prices.create` first, then `paymentLinks.create({line_items: [{price: priceId}]})`. Two API calls instead of one, but the link is reusable.

### Hard guard on Stripe key
```ts
if (STRIPE_KEY && !STRIPE_KEY.startsWith("sk_test_")) {
  throw new Error("STRIPE_SECRET_KEY must start with sk_test_");
}
```
Impossible to charge real money by accident.

### Vapi configured via REST API (CLI is broken)
The `@vapi-ai/cli` postinstall script crashes (`Cannot read properties of undefined (reading 'find')`). Workaround: PATCH directly against `https://api.vapi.ai/phone-number/{id}` with `Authorization: Bearer {privateKey}`. Faster than fighting the npm package.

### `cited.md` hand-rolled (no Guild SDK)
The function `buildCitedMdEntry({action, sources})` returns markdown. Called from `generate-config` (action `agent_onboarded`) and `create-order` (action `order_created`). Format ready to integrate with the official `cited.md` publication endpoint when the spec lands.

---

## Sponsor coverage

| Sponsor | Used | Marked on Devpost |
|---|---|---|
| **Vapi** | Onboarder phone + assistant configuration via REST API | ✅ |
| **Redis** | Sessions, transcripts, orders, cited entries | ✅ |
| **Senso** (Grand Prize · Context Engineering) | DayZero literally converts spoken context into executable config | ✅ |
| **Shipables** (Universal) | Skill published, cross-tool manifest covers Claude Code, Cursor, Copilot, Gemini CLI | ✅ |
| **Tokens&** ($500) | Promotional posts on X | ✅ |
| Wundergraph | Replaced by `Promise.all` in Node | ❌ (honest) |
| Twilio / WhatsApp | Replaced by Telegram | ❌ (honest) |
| Chainguard | `Dockerfile` written but not deployed; Heroku buildpack used | ❌ (honest) |
| InsForge | Redis-only persistence | ❌ (honest) |
| Guild | `cited.md` hand-rolled | ❌ (honest) |
| x402 | Optional micropayment, not implemented | ❌ (honest) |

> **Invariant:** an unmarked prize is always better than a falsely marked one.

---

## What's next

- Wundergraph supergraph for unified Stripe + WhatsApp + scheduler tool fanout
- Auto-provisioning of a fresh Vapi number per generated agent
- `assistantOverrides.metadata.sessionId` to link install-time and call-time sessions deterministically (replacing the `--latest` shim)
- x402 micropayment on install
- Web dashboard with live transcript streaming via Redis pub/sub (already wired in `lib/redis.ts`)
- Official `cited.md` publication endpoint integration (pending Senso confirmation of format)
- Native Chainguard runtime via Heroku Container Registry (the `Dockerfile` is already in the repo)

---

## Team

- **Jair Celis** — tech lead + integration ([@jaircelisv](https://github.com/jaircelisv))
- **Gael** — backend + integrations
- **Daniel** — pitch + submission + judge relations
- **Yurany** — voice + storytelling

---

## License

MIT — see `LICENSE`.

---

## Links

- **Live backend:** https://dayzero-onboard-7054-325356381078.herokuapp.com/health
- **Shipables registry:** https://codeables.dev/skills/jaircelisv/dayzero-voice-onboard
- **GitHub:** https://github.com/jaircelisv/DayZero-voice-onboard
- **Onboarder phone (try it):** `+1 (443) 391 9140`
