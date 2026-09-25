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

# -- step 2: write preview metadata and SPA redirects ------------------------
# A project's output root is the outermost directory containing an index.html.
# Nested output roots (for example composed Storybooks or Compodoc demos) are not listed.
echo "preview.setIssueNumber(\"${ISSUE_NUMBER}\");" >>"$METADATA_FILE"

for section in apps compodoc storybook; do
  section_dir="${DEPLOY_DIR}/${section}"
  [[ -d "$section_dir" ]] || continue

  while IFS= read -r -d '' project_dir; do
    rel_path="${project_dir#"${DEPLOY_DIR}"/}"
    echo "preview.addDirectory(\"${section}\", \"${rel_path}\");" >>"$METADATA_FILE"

    if [[ "$section" == "apps" ]]; then
      echo "/${rel_path}/* /${rel_path}/index.html 200" >>"${DEPLOY_DIR}/_redirects"
    fi
  done < <(find "$section_dir" -type d -exec test -f '{}/index.html' \; -print0 -prune)
done
