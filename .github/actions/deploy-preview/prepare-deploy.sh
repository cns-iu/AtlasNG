#!/usr/bin/env bash
set -euo pipefail
shopt -s extglob

# ---------------------------------------------------------------------------
# prepare-deploy.sh
# Prepares the deploy directory for a Netlify preview deployment.
#
# Usage:
#   prepare-deploy.sh [OPTIONS]
#
# Options:
#   -d, --deploy-dir  DIR   Directory to deploy into          (env: DEPLOY_DIR,   default: deploy)
#   -s, --dist-dir    DIR   Source dist directory             (env: DIST_DIR,     default: dist)
#   -a, --action-path DIR   Path to the action (assets dir)  (env: ACTION_PATH,  required)
#   -i, --issue-number NUM  Pull request / issue number       (env: ISSUE_NUMBER, required)
#   -m, --metadata-file FILE Path to the metadata JS file    (env: METADATA_FILE, default: <deploy-dir>/metadata.js)
#   -h, --help              Show this help message and exit
# ---------------------------------------------------------------------------

usage() {
  sed -n '/^# Usage:/,/^# -----/p' "$0" | sed 's/^# \?//'
  exit "${1:-0}"
}

# -- defaults (may be overridden by env vars or flags) ----------------------
DEPLOY_DIR="${DEPLOY_DIR:-deploy}"
DIST_DIR="${DIST_DIR:-dist}"
ACTION_PATH="${ACTION_PATH:-}"
ISSUE_NUMBER="${ISSUE_NUMBER:-}"
METADATA_FILE="${METADATA_FILE:-}"

# -- argument parsing -------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
  -d | --deploy-dir)
    DEPLOY_DIR="$2"
    shift 2
    ;;
  -s | --dist-dir)
    DIST_DIR="$2"
    shift 2
    ;;
  -a | --action-path)
    ACTION_PATH="$2"
    shift 2
    ;;
  -i | --issue-number)
    ISSUE_NUMBER="$2"
    shift 2
    ;;
  -m | --metadata-file)
    METADATA_FILE="$2"
    shift 2
    ;;
  -h | --help) usage 0 ;;
  *)
    echo "Unknown option: $1" >&2
    usage 1
    ;;
  esac
done

# -- validation -------------------------------------------------------------
if [[ -z "$ACTION_PATH" ]]; then
  echo "Error: --action-path / ACTION_PATH is required." >&2
  usage 1
fi
if [[ -z "$ISSUE_NUMBER" ]]; then
  echo "Error: --issue-number / ISSUE_NUMBER is required." >&2
  usage 1
fi

# Apply metadata file default now that DEPLOY_DIR is resolved
METADATA_FILE="${METADATA_FILE:-${DEPLOY_DIR}/metadata.js}"

# -- step 1: copy files to deploy directory ---------------------------------
mkdir -p "$DEPLOY_DIR"
cp -r "${DIST_DIR}"/!(libs) "${DEPLOY_DIR}/"
cp -r "${ACTION_PATH}/assets"/* "${DEPLOY_DIR}/"

# -- step 2: move applications out of their browser/ subdirectory -----------
for browser_dir in "${DEPLOY_DIR}/apps"/*/browser; do
  [[ -d "$browser_dir" ]] || continue
  mv "${browser_dir}"/* "$(dirname "$browser_dir")/"
  rm -rf "$browser_dir"
done

# -- step 3: write preview metadata ----------------------------------------
echo "preview.setIssueNumber(\"${ISSUE_NUMBER}\");" >>"$METADATA_FILE"

for section in apps compodoc storybook; do
  for dir in "${DEPLOY_DIR}/${section}"/*/; do
    [[ -d "$dir" ]] || continue
    echo "preview.addDirectory(\"${dir%/}\");" >>"$METADATA_FILE"
  done
done

# -- step 4: create SPA redirects -------------------------------------------
for dir in "${DEPLOY_DIR}/apps"/*/; do
  [[ -d "$dir" ]] || continue
  name=$(basename "$dir")
  echo "/apps/${name}/* /apps/${name}/index.html 200" >>"${DEPLOY_DIR}/_redirects"
done
