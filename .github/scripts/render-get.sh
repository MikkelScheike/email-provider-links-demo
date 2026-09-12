#!/usr/bin/env bash
# GET a Render API URL and write JSON to a file. Prints the HTTP status code.
# Usage: render-get.sh <output-file> <url>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./render-api.sh
source "${SCRIPT_DIR}/render-api.sh"

if [ "$#" -lt 2 ]; then
  echo "Usage: render-get.sh <output-file> <url>" >&2
  exit 2
fi

render_get "$1" "$2"
