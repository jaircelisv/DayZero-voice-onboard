# @dayzero/voice-onboard

> Onboard a production voice agent by talking to a phone number for 60 seconds.

**Install:**

```bash
shipables install @dayzero/voice-onboard
```

**Then call:** `+1 (443) 391-9140`

Describe your business. Hang up. In 60 seconds you get:

- A deployed Vapi voice agent on a new number
- A YAML config you can inspect and edit
- An InsForge backend handling business logic
- A Wundergraph supergraph unifying Stripe + WhatsApp + scheduler
- A signed `cited.md` audit entry with legal reasoning + sources

---

## What this skill does

DayZero replaces the 2-hour manual setup of a voice agent with a conversation. You dial the onboarder number, describe the business (what it does, hours, what the agent should/shouldn't do, tone), and the skill generates and deploys everything.

**This is not another Vapi wrapper.** Vapi is the engine. DayZero is the meta-skill that programs the engine by voice.

## Supported tools (cross-tool / universal)

| Tool | Invocation | Status |
|---|---|---|
| Claude Code | `/dayzero-onboard` | ✅ |
| Cursor | `.mdc` rule | ✅ |
| GitHub Copilot | `@dayzero` chat participant | ✅ |
| Gemini CLI | extension | ✅ |

See [`manifest.json`](./manifest.json) for the full compatibility matrix.

## Flow

1. **Install** the skill in your IDE.
2. **Call** `+1 (443) 391-9140`.
3. The onboarder asks ~5 questions in ~60 seconds (business type, offering, agent job, hard no's, tone).
4. On hangup, Vapi webhooks the transcript → DayZero generates config → InsForge deploys → Wundergraph wires tools → a new Vapi number is provisioned for **your** agent.
5. Your IDE receives the session bundle: YAML, number, dashboard link, `cited.md` entry URL.

## Sponsor integrations

- **Vapi** — phone + STT/TTS for both the onboarder and the generated agent
- **Wundergraph** — one supergraph per generated agent (Stripe + WhatsApp + scheduler)
- **InsForge** — backend deployment target
- **Guild** — signs commercial transactions the generated agent executes
- **Redis** — session state + transcript cache during onboarding
- **Chainguard** — hardened base images for the deployed backend
- **cited.md** — every onboarding session + every signed transaction published as an audit entry
- **x402** *(optional)* — agentic micropayment on install

## Project layout

```
dayzero-voice-onboard/
├── package.json
├── manifest.json            # cross-tool metadata
├── README.md
├── entrypoints/
│   ├── index.js             # local runtime shim
│   ├── install.sh           # shipables install hook
│   ├── onboard.ts           # kicks off a session
│   ├── post-call.ts         # handles Vapi transcript webhook
│   ├── claude-code/skill.md
│   ├── cursor/rule.mdc
│   ├── copilot/chat-participant.md
│   └── gemini-cli/extension.toml
├── prompts/
│   └── onboarder-system-prompt.md
└── assets/
    ├── icon.png
    └── cover.png
```

## Status

🚧 **Hackathon build · Ship to Prod · Tokens& 2026** — scaffold phase. See [`../../docs/jair.md`](../../docs/jair.md) for engineering milestones.
