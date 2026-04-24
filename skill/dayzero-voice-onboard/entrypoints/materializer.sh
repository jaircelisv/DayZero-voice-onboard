#!/usr/bin/env bash
# DayZero · Materializer
# Polls /api/sessions/:id/bundle and writes generated files to ./dayzero/
# Usage: bash materializer.sh <sessionId>
set -euo pipefail

SESSION_ID="${1:-}"
BASE="${DAYZERO_API_BASE:-https://dayzero-onboard-7054-325356381078.herokuapp.com}"
MAX_WAIT_SECONDS=90
POLL_INTERVAL=3
START=$(date +%s)

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "--latest" ]; then
  echo "🔍 No session ID given · waiting for the latest call to complete..."
  while true; do
    ELAPSED=$(( $(date +%s) - START ))
    if [ "$ELAPSED" -ge "$MAX_WAIT_SECONDS" ]; then
      echo "❌ Timeout waiting for any session with YAML."
      exit 1
    fi
    LATEST=$(curl -fsS "${BASE}/api/sessions/latest-with-yaml" 2>/dev/null || echo '{}')
    SESSION_ID=$(echo "$LATEST" | python3 -c "import json,sys; print(json.load(sys.stdin).get('sessionId',''))" 2>/dev/null || echo "")
    if [ -n "$SESSION_ID" ]; then
      echo "✓ Found session: $SESSION_ID"
      break
    fi
    echo "  ... no completed session yet (${ELAPSED}s)"
    sleep "$POLL_INTERVAL"
  done
fi

echo "⏳ Materializing config for session: $SESSION_ID..."

while true; do
  ELAPSED=$(( $(date +%s) - START ))
  if [ "$ELAPSED" -ge "$MAX_WAIT_SECONDS" ]; then
    echo "❌ Timeout after ${MAX_WAIT_SECONDS}s. Bundle not ready."
    echo "   Inspect: curl ${BASE}/api/sessions/${SESSION_ID}/bundle"
    exit 1
  fi

  RESPONSE=$(curl -fsS "${BASE}/api/sessions/${SESSION_ID}/bundle" 2>/dev/null || echo '{"status":"error"}')
  STATUS=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "parse_error")

  if [ "$STATUS" = "ready" ]; then
    echo "✓ Config ready · materializing files..."
    BUNDLE_TMP=$(mktemp)
    printf '%s' "$RESPONSE" > "$BUNDLE_TMP"
    python3 - "$BUNDLE_TMP" <<'PY'
import json, os, sys
with open(sys.argv[1]) as fh:
    data = json.load(fh)
for f in data.get("files", []):
    path = f["path"]
    content = f["content"]
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w") as fh:
        fh.write(content)
    print(f"  ✓ wrote {path} ({len(content)} bytes)")
agent_number = data.get("agentNumber", "")
if agent_number:
    print(f"\n\U0001F4DE Generated agent number: {agent_number}")
print(f"\U0001F4CB cited.md entry: ./dayzero/cited.md")
PY
    rm -f "$BUNDLE_TMP"
    echo ""
    echo "🎉 Done. Open ./dayzero/agent.yaml to inspect the config."
    exit 0
  fi

  if [ "$STATUS" = "error" ] || [ "$STATUS" = "parse_error" ]; then
    echo "  ... backend hiccup, retrying in ${POLL_INTERVAL}s"
  else
    echo "  ... $STATUS (${ELAPSED}s elapsed)"
  fi
  sleep "$POLL_INTERVAL"
done
