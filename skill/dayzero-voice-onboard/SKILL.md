---
name: dayzero-voice-onboard
description: "Onboard a Vapi voice agent by calling +1 (443) 391 9140 and describing your business in 60-90 seconds. Generates YAML config, materializes files into your IDE, and (optionally) wires the agent to a Stripe payment-link + Telegram notifier with a cited.md audit trail. Cross-tool support for Claude Code, Cursor, Copilot, and Gemini CLI."
license: MIT
compatibility: |
  Requires network access (curl, python3) to reach the DayZero backend
  (https://dayzero-onboard-7054-325356381078.herokuapp.com). The actual onboarding
  call goes to the Vapi number +1 (443) 391 9140 from any phone. Works on macOS
  and Linux. No local LLM required — config generation is GPT-4o-mini server-side.
metadata:
  author: jaircelisv
  version: "0.1.0"
  hackathon: "Tokens& 2026 · Ship to Prod"
---

# DayZero · Voice Agent Onboarder

Onboard a production voice agent by talking to a phone number for 60 seconds.
No YAML to write, no dashboards to click. Voice in. Real money out.

## When to invoke this skill

Trigger when the user:
- Asks to "build / create / set up / configure a voice agent"
- Mentions a small business that needs to take phone calls
  (bakery, salon, clinic, restaurant, repair shop, etc.)
- Is starting from scratch with Vapi and does not want to write config by hand
- Wants to onboard a non-technical business owner who just wants the agent live

Do NOT invoke if the user already has a configured voice agent and only wants to
edit a single field — pointing them to the `agent.yaml` file is faster.

## Flow (you, the host agent, do this)

1. Run the install hook to reserve a session and print the phone number:
   ```bash
   bash entrypoints/install.sh
   ```

2. Tell the user:
   > "Call **+1 (443) 391 9140** now and describe your business for ~60-90 seconds.
   > Hang up when DayZero says 'Perfect, your agent will be live in a minute.'
   > I'll watch for the config."

3. Once the user confirms the call ended, materialize the generated files:
   ```bash
   bash entrypoints/materializer.sh --latest
   ```
   This polls the backend and writes:
   - `./dayzero/agent.yaml` — generated agent config (name, language, voice, system
     prompt, tools, schedule, payment, owner notification channel)
   - `./dayzero/cited.md` — audit entry with sources (Vapi call ID, transcript
     length, YAML source, onboarder number)

4. Read `./dayzero/agent.yaml` aloud to the user (highlight: name, language, the
   tools it has, business hours, payment rules). Ask if anything needs to change
   before deployment.

5. (Optional · the "plus") Trigger a sample order to demonstrate the downstream
   agent in action:
   ```bash
   curl -X POST https://dayzero-onboard-7054-325356381078.herokuapp.com/api/agent/<agentName>/createOrder \
     -H "content-type: application/json" \
     -d '{"product":"empanadas","quantity":24,"customerName":"Carmen","customerPhone":"+57301234567","scheduledAt":"2026-04-27 15:00","depositCents":900,"currency":"usd"}'
   ```
   The response includes a real Stripe (test mode) payment link, a Telegram
   message ID delivered to the configured owner chat, and an updated cited.md
   entry. All emitted in parallel via `Promise.all`.

## Key talking points

- "You don't configure it — you describe it."
- One install. One call. One agent vivo.
- Every action is signed in cited.md.
- Cross-tool: Claude Code, Cursor, GitHub Copilot, Gemini CLI.
- Built at Tokens& 2026 · Ship to Prod by the DayZero team
  (Jair, Gael, Dani, Yurany).

## Architecture (so the host agent can debug if needed)

- **Onboarder phone:** Vapi number `+1 (443) 391 9140`, assistant
  `48b36e41-665b-4754-a637-84f5801b9105`. System prompt at
  `prompts/onboarder-system-prompt.md`.
- **Backend:** Express + TypeScript on Heroku. Source:
  https://github.com/jaircelisv/DayZero-voice-onboard
  - `POST /api/sessions/reserve` — install hook calls this; TTL 1h in Redis
  - `POST /webhook/vapi/onboard-transcript` — Vapi end-of-call report receiver
  - `POST /api/generate-config` — GPT-4o-mini converts transcript → YAML
  - `GET  /api/sessions/latest-with-yaml` — for materializer auto-discovery
  - `GET  /api/sessions/:id/bundle` — returns `{yaml, files[], citedMdEntry}`
  - `POST /api/agent/:agentId/createOrder` — Stripe paymentLink + Telegram fanout
- **Storage:** Redis Cloud (sessions, transcripts, orders, cited entries)
- **LLM:** OpenAI GPT-4o-mini (server-side; user does not need their own key)
- **Cross-tool entrypoints:** see `entrypoints/{claude-code,cursor,copilot,gemini-cli}/`
