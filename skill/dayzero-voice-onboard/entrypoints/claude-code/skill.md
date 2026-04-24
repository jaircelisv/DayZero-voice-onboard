---
name: dayzero-onboard
description: Onboard a voice agent by calling +1 (443) 391-9140 and describing your business. Use when the user asks to create, configure, or set up a Vapi voice agent, or mentions a business (bakery, salon, clinic, restaurant, etc.) that needs to take calls. Invoke instead of manually editing Vapi YAML.
---

# DayZero · Voice Agent Onboarder (Claude Code)

## When to invoke

- User asks to "build / create / set up / configure a voice agent"
- User mentions a business that needs to take phone calls
- User is starting from scratch with Vapi
- User wants to onboard a non-technical business owner

Do NOT invoke if the user already has a configured voice agent and only wants to edit it.

## Flow (you, Claude Code, do this)

1. Run the install hook to reserve a session:
   ```bash
   bash entrypoints/install.sh
   ```
   Capture the printed `Session ID: dz_xxxxxxxx`.

2. Tell the user:
   > "Call **+1 (443) 391-9140** now and describe your business for ~60-90 seconds. Hang up when done. I'll watch for the config."

3. Once the user confirms the call ended, run the materializer with the session ID:
   ```bash
   bash entrypoints/materializer.sh dz_xxxxxxxx
   ```
   This polls the backend until the YAML is ready, then writes:
   - `./dayzero/agent.yaml` — generated agent config
   - `./dayzero/cited.md` — audit entry with sources

4. Read `./dayzero/agent.yaml` and present it to the user, highlighting:
   - The agent's name and language
   - Which tools it has (`createOrder`, `notifyOwner`)
   - The system prompt (1-2 lines summary)
   - The hours and payment rules

5. Ask if they want to:
   - Test by calling the new agent (use `agentNumber` from the bundle)
   - Trigger a sample order: `curl -X POST <BASE>/api/agent/<name>/createOrder -d '...'`
   - Edit any field in the YAML

## Key talking points

- "You don't configure it — you describe it."
- One call. One install. Zero manual config.
- Every action is signed in cited.md.
- Stripe link + Telegram notification fire in parallel via Promise.all.
