#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# deploy.sh
# Deploys the prepared preview directory to Netlify and writes url output.
#
# Usage:
#   deploy.sh [OPTIONS]
#
# Options:
#   -d, --deploy-dir  DIR   Directory to deploy                (env: DEPLOY_DIR,          default: deploy)
#   -f, --filter      NAME  Netlify monorepo filter            (env: NETLIFY_FILTER,      default: AtlasNg)
#   -i, --issue-number NUM  Pull request / issue number        (env: ISSUE_NUMBER,        required unless alias set)
#   -l, --alias       NAME  Netlify deploy alias               (env: NETLIFY_ALIAS,       default: pr-<issue-number>)
#   -a, --auth-token  TOKEN Netlify auth token                 (env: NETLIFY_AUTH_TOKEN,  required)
#   -s, --site-id     ID    Netlify site id                    (env: NETLIFY_SITE_ID,     required)
#   -o, --output-file FILE  GitHub output file for url output  (env: GITHUB_OUTPUT,       optional)
#   -h, --help              Show this help message and exit
# ---------------------------------------------------------------------------

usage() {
  sed -n '/^# Usage:/,/^# -----/p' "$0" | sed 's/^# \?//'
  exit "${1:-0}"
}

DEPLOY_DIR="${DEPLOY_DIR:-deploy}"
NETLIFY_FILTER="${NETLIFY_FILTER:-AtlasNg}"
ISSUE_NUMBER="${ISSUE_NUMBER:-}"
NETLIFY_ALIAS="${NETLIFY_ALIAS:-}"
NETLIFY_AUTH_TOKEN="${NETLIFY_AUTH_TOKEN:-}"
NETLIFY_SITE_ID="${NETLIFY_SITE_ID:-}"
OUTPUT_FILE="${GITHUB_OUTPUT:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
  -d | --deploy-dir)
    DEPLOY_DIR="$2"
    shift 2
    ;;
  -f | --filter)
    NETLIFY_FILTER="$2"
    shift 2
    ;;
  -i | --issue-number)
    ISSUE_NUMBER="$2"
    shift 2
    ;;
  -l | --alias)
    NETLIFY_ALIAS="$2"
    shift 2
    ;;
  -a | --auth-token)
    NETLIFY_AUTH_TOKEN="$2"
    shift 2
    ;;
  -s | --site-id)
    NETLIFY_SITE_ID="$2"
    shift 2
    ;;
  -o | --output-file)
    OUTPUT_FILE="$2"
    shift 2
    ;;
  -h | --help)
    usage 0
    ;;
  *)
    echo "Unknown option: $1" >&2
    usage 1
    ;;
  esac
done

if [[ -z "$NETLIFY_AUTH_TOKEN" ]]; then
  echo "Error: --auth-token / NETLIFY_AUTH_TOKEN is required." >&2
  usage 1
fi
if [[ -z "$NETLIFY_SITE_ID" ]]; then
  echo "Error: --site-id / NETLIFY_SITE_ID is required." >&2
  usage 1
fi
if [[ -z "$NETLIFY_ALIAS" && -z "$ISSUE_NUMBER" ]]; then
  echo "Error: --issue-number / ISSUE_NUMBER is required unless --alias / NETLIFY_ALIAS is set." >&2
  usage 1
fi

NETLIFY_ALIAS="${NETLIFY_ALIAS:-pr-${ISSUE_NUMBER}}"

RESPONSE=$(npx -y netlify-cli@26.0.0 deploy \
  --dir="$DEPLOY_DIR" \
  --filter="$NETLIFY_FILTER" \
  --alias="$NETLIFY_ALIAS" \
  --no-build \
  --json \
  --auth="$NETLIFY_AUTH_TOKEN" \
  --site="$NETLIFY_SITE_ID")
URL=$(echo "$RESPONSE" | jq -r '.deploy_url')

echo "$RESPONSE"
if [[ -n "$OUTPUT_FILE" ]]; then
  echo "url=$URL" >>"$OUTPUT_FILE"
fi
