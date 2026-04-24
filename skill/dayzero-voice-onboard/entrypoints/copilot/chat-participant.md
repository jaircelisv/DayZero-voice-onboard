# @dayzero · GitHub Copilot Chat Participant

**Participant ID:** `@dayzero`
**Trigger phrases:** "voice agent", "vapi", "phone agent", "onboard caller"

## Responsibilities

When invoked with `@dayzero`, Copilot should:

1. Prompt the user to dial **+1 (443) 391-9140** and describe the business in natural language.
2. Call `POST https://api.dayzero.dev/sessions` to reserve a session.
3. After the user's call ends, poll `GET https://api.dayzero.dev/sessions/{id}` until `status=ready`.
4. Present the returned YAML, agent phone number, backend URL, and cited.md entry in a code block, with a diff preview if the repo already has `./dayzero/agent.yaml`.

## Sample turns

**User:** `@dayzero my aunt has a bakery in Medellín, need an agent`
**Copilot:** `Got it. Call +1 (443) 391-9140 from your phone and describe the bakery for ~60s. I'll watch for the config.`

**User:** `@dayzero done, I hung up`
**Copilot:** *(polls session, returns bundle)*
