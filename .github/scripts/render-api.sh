#!/usr/bin/env bash
# Shared Render API helpers for GitHub Actions.
# Expects RENDER_API_KEY in the environment.

sanitize_render_api_key() {
  local value="${1-}"
  value="${value//$'\r'/}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  if [[ "$value" == \"*\" ]]; then
    value="${value#\"}"
    value="${value%\"}"
  elif [[ "$value" == \'*\' ]]; then
    value="${value#\'}"
    value="${value%\'}"
  fi
  case "$value" in
    [Bb][Ee][Aa][Rr][Ee][Rr][[:space:]]*)
      value="${value#*[[:space:]]}"
      value="${value#"${value%%[![:space:]]*}"}"
      ;;
  esac
  printf '%s' "$value"
}

describe_render_api_key() {
  local raw="${1-}"
  local sanitized
  sanitized="$(sanitize_render_api_key "$raw")"
  echo "RENDER_API_KEY length: ${#raw} characters"
  if [[ "$raw" != "$sanitized" ]]; then
    echo "Normalized API key (trimmed quotes/whitespace/Bearer prefix). Sanitized length: ${#sanitized}"
  fi
  if [[ "$raw" =~ [[:space:]] ]]; then
    echo "Note: the secret contains whitespace, which often causes HTTP 401."
  fi
}

render_get() {
  local out="$1"
  shift
  local key
  key="$(sanitize_render_api_key "${RENDER_API_KEY:-}")"
  curl -sS -o "$out" -w "%{http_code}" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${key}" \
    --get "$@"
}
