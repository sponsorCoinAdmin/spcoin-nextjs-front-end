#!/usr/bin/env bash
# scripts/linixbuild.sh
# Safe, low-RAM build & (re)start for spcoin-nextjs-front-end on t4g.small
# - no code edits, relies purely on package.json/package-lock
# - adds swap only if needed
# - ensures devDependencies are installed (tailwind/postcss, etc.)
# - builds with minimal SWC workers + capped heap
# - (re)starts via PM2 the same way as your alias does

set -euo pipefail

APP_DIR="/srv/sponsorcoin/SPCOIN-PROJECT-MODULES/spcoin-nextjs-front-end"
PROC_NAME="spcoin-frontend"
PORT="3000"
HEAP_MB="${HEAP_MB:-1024}"          # bump to 1400 if still OOMs
SWC_WORKERS="${SWC_WORKERS:-1}"     # 1 uses least RAM
LOG_DIR="${APP_DIR}/.deploylogs"
BUILD_LOG="${LOG_DIR}/build_$(date +%Y%m%d_%H%M%S).log"

#--- helpers ---------------------------------------------------------------#
say() { printf "\n\033[1;36m[spcoin]\033[0m %s\n" "$*"; }
err() { printf "\n\033[1;31m[ERROR]\033[0m %s\n\n" "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }

#--- preflight -------------------------------------------------------------#
mkdir -p "$LOG_DIR"
cd "$APP_DIR"

say "Node $(node -v 2>/dev/null || echo 'N/A'), npm $(npm -v 2>/dev/null || echo 'N/A')"
say "Working dir: $(pwd)"
say "Saving logs to: $BUILD_LOG"

# Ensure we won’t skip devDependencies (tailwind/postcss/autoprefixer live here)
# npm respects env var npm_config_production=false OR --include=dev
export npm_config_production=false

#--- optional: small, idempotent swap burst --------------------------------#
# We add a 2G swapfile if total swap < 4G. Skip if already present/active.
need_swap() {
  local total_sw_kb
  total_sw_kb=$(awk '/SwapTotal:/ {print $2}' /proc/meminfo)
  # < 4 GiB ?
  [ "${total_sw_kb:-0}" -lt $((4*1024*1024)) ]
}
add_swap_if_needed() {
  if need_swap; then
    if ! grep -q '/swapfile2' /proc/swaps 2>/dev/null; then
      say "Adding temporary 2G swapfile (/swapfile2) for build headroom…"
      sudo fallocate -l 2G /swapfile2 2>/dev/null || sudo dd if=/dev/zero of=/swapfile2 bs=1M count=2048
      sudo chmod 600 /swapfile2
      sudo mkswap /swapfile2 >/dev/null
      sudo swapon /swapfile2 || true
    else
      say "Swapfile /swapfile2 already active; skipping."
    fi
  else
    say "Total swap >= 4G; not adding extra swap."
  fi
}
add_swap_if_needed

#--- stop app while we build ----------------------------------------------#
if have npx; then
  say "Stopping PM2 process (${PROC_NAME}) if running…"
  npx pm2 stop "${PROC_NAME}" >/dev/null 2>&1 || true
fi

#--- clean & install -------------------------------------------------------#
say "Cleaning previous build artifacts…"
rm -rf .next

say "Installing deps (including dev) with npm ci…"
# --no-audit --prefer-offline keeps it quick/stable on small boxes
( npm ci --include=dev --no-audit --prefer-offline ) 2>&1 | tee -a "$BUILD_LOG"

#--- build with low-RAM knobs ----------------------------------------------#
export SWC_WORKER_COUNT="${SWC_WORKERS}"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=${HEAP_MB} --heapsnapshot-near-heap-limit=1"

say "Building Next.js (heap=${HEAP_MB}MB, swcWorkers=${SWC_WORKERS})…"
if ! ( npm run build ) 2>&1 | tee -a "$BUILD_LOG"; then
  err "Build failed. See $BUILD_LOG"
  exit 1
fi

#--- sanity: verify build exists ------------------------------------------#
if [ ! -f ".next/BUILD_ID" ] && [ ! -d ".next/server" ]; then
  err "No production build found in .next after build!"
  exit 2
fi
say "Build complete."

#--- (re)start app via PM2 (same way your alias does) ----------------------#
say "Starting ${PROC_NAME} under PM2…"
# Use bash -c so we fully control the exact command like your alias:
START_CMD="npx next start -p ${PORT} -H 127.0.0.1"
if npx pm2 describe "${PROC_NAME}" >/dev/null 2>&1; then
  npx pm2 delete "${PROC_NAME}" >/dev/null 2>&1 || true
fi
npx pm2 start /usr/bin/bash --name "${PROC_NAME}" -- -lc "${START_CMD}"
npx pm2 save >/dev/null || true

#--- quick health checks ---------------------------------------------------#
say "Waiting for port ${PORT}…"
for i in {1..30}; do
  if ss -ltnp | grep -q ":${PORT} "; then break; fi
  sleep 1
done
ss -ltnp | grep ":${PORT} " || { err "Nothing is listening on :${PORT}"; exit 3; }

say "Local curl to Next /Exchange…"
curl -sS -I "http://127.0.0.1:${PORT}/Exchange" | sed -n '1,5p' || true

say "Done. PM2 status:"
npx pm2 ls || true

say "Tip: Nginx should proxy to 127.0.0.1:${PORT}. Try:  curl -I https://sponsorcoin.org/Exchange"
