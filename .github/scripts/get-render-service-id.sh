#!/usr/bin/env bash
# Resolve a Render service ID for GitHub Actions.
# Expected env: GITHUB_OUTPUT, RENDER_API_KEY, optional RENDER_SERVICE_ID,
# RENDER_SERVICE_NAME, INPUT_SERVICE_ID.
set -euo pipefail

DEFAULT_SERVICE_NAME="email-provider-links-demo"
API_BASE="https://api.render.com/v1"

if [ -n "${INPUT_SERVICE_ID:-}" ]; then
  echo "service_id=${INPUT_SERVICE_ID}" >> "$GITHUB_OUTPUT"
  echo "✅ Using service ID from workflow input"
  exit 0
fi

if [ -n "${RENDER_SERVICE_ID:-}" ]; then
  echo "service_id=${RENDER_SERVICE_ID}" >> "$GITHUB_OUTPUT"
  echo "✅ Using service ID from secrets"
  exit 0
fi

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "❌ RENDER_API_KEY secret is not set."
  echo "Set RENDER_API_KEY, or set RENDER_SERVICE_ID to skip the lookup."
  exit 1
fi

SERVICE_NAME="${RENDER_SERVICE_NAME:-$DEFAULT_SERVICE_NAME}"
echo "🔍 Looking for service: $SERVICE_NAME"

render_get() {
  local out="$1"
  shift
  curl -sS -o "$out" -w "%{http_code}" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    --get "$@"
}

print_api_error() {
  local code="$1"
  local body="$2"
  echo "❌ Render API returned HTTP ${code}"
  if [ "$code" = "401" ] || [ "$code" = "403" ]; then
    echo "The RENDER_API_KEY secret is missing, expired, or does not have access."
  elif [ "$code" = "406" ]; then
    echo "Render rejected the request (Not Acceptable). This workflow sends Accept: application/json."
  fi
  jq -r '.message // .error // .' "$body" 2>/dev/null || cat "$body"
}

BODY="$(mktemp)"
HTTP_CODE="$(render_get "$BODY" "${API_BASE}/services" \
  --data-urlencode "name=${SERVICE_NAME}" \
  --data-urlencode "limit=20")"

if [ "$HTTP_CODE" != "200" ]; then
  print_api_error "$HTTP_CODE" "$BODY"
  exit 1
fi

if ! jq -e 'type == "array"' "$BODY" >/dev/null 2>&1; then
  echo "❌ Unexpected Render API response (expected a JSON array):"
  cat "$BODY"
  exit 1
fi

SERVICE_ID="$(jq -r --arg name "$SERVICE_NAME" '
  .[]
  | (.service // .)
  | select(.name == $name)
  | .id
' "$BODY" | head -n 1)"

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" = "null" ]; then
  echo "❌ Could not find service '$SERVICE_NAME'"
  LIST_BODY="$(mktemp)"
  LIST_CODE="$(render_get "$LIST_BODY" "${API_BASE}/services" --data-urlencode "limit=100")"
  echo ""
  echo "Available services:"
  if [ "$LIST_CODE" = "200" ] && jq -e 'type == "array"' "$LIST_BODY" >/dev/null 2>&1; then
    jq -r '.[] | (.service // .) | "  - \(.name) (ID: \(.id))"' "$LIST_BODY"
  else
    echo "  (could not list services; HTTP ${LIST_CODE})"
    jq -r '.message // .error // .' "$LIST_BODY" 2>/dev/null || cat "$LIST_BODY"
  fi
  echo ""
  echo "Set RENDER_SERVICE_ID, or RENDER_SERVICE_NAME if the service uses a different name."
  exit 1
fi

echo "service_id=${SERVICE_ID}" >> "$GITHUB_OUTPUT"
echo "✅ Found service ID: ${SERVICE_ID}"
