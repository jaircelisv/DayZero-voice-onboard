#!/usr/bin/env bash
# DayZero voice-onboard · install hook
# Called by `shipables install @dayzero/voice-onboard`.
# Reserves a session via the DayZero backend and prints user instructions.
set -euo pipefail

BASE="${DAYZERO_API_BASE:-https://dayzero-onboard-7054-325356381078.herokuapp.com}"
DEV_ID="${SHIPABLES_USER_ID:-anonymous}"

RESPONSE=$(curl -fsS -X POST "$BASE/api/sessions/reserve" \
  -H "content-type: application/json" \
  -d "{\"devId\":\"$DEV_ID\"}" 2>/dev/null || true)

if [ -z "$RESPONSE" ]; then
  cat <<EOF
✓ Installed @dayzero/voice-onboard v0.1.0
✓ Onboarding number: +1 (443) 391-9140

(Could not reserve a session — backend unreachable. You can still call the
number above; a session will be auto-created on call.)
EOF
  exit 0
fi

SESSION_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('sessionId',''))" 2>/dev/null || echo "")
NUMBER=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('onboarderNumber','+1 (443) 391-9140'))" 2>/dev/null || echo "+1 (443) 391-9140")
EXPIRES=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('expiresInSeconds',3600))" 2>/dev/null || echo "3600")
EXPIRES_MIN=$((EXPIRES / 60))

cat <<EOF
✓ Installed @dayzero/voice-onboard v0.1.0
✓ Onboarding number: $NUMBER
✓ Session ID: $SESSION_ID  (expires in ${EXPIRES_MIN} min)

To configure your first agent, call the number above and describe
your business. Your IDE will receive the config in ~60 seconds.
EOF
