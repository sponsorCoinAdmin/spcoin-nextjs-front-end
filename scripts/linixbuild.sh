# File: ~/buildspc.bash
#!/usr/bin/env bash
set -euo pipefail

############################################################
# SponsorCoin — Build & Run (AL2023 / t4g.small friendly)
# - Installs dev deps (Tailwind etc.)
# - Builds with low RAM knobs + swap safety
# - Starts Next via PM2 bound to 127.0.0.1:3000
# - Leaves Nginx to reverse-proxy (already configured)
############################################################

APP_DIR="/srv/sponsorcoin/SPCOIN-PROJECT-MODULES/spcoin-nextjs-front-end"
PM2_NAME="spcoin-frontend"
PORT="3000"
HOST="127.0.0.1"
SWAPFILE="/swapfile2"
SWAPSIZE_GB="4"

log() { printf "\n\033[1;36m[buildspc]\033[0m %s\n" "$*"; }
err() { printf "\n\033[1;31m[buildspc ERROR]\033[0m %s\n" "$*" >&2; }
run() { log "$*"; eval "$@"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing required command: $1"; exit 1; }
}

# 0) Sanity checks
require_cmd node
require_cmd npm
require_cmd npx
require_cmd curl

log "Node version: $(node -v)"
log "NPM version : $(npm -v)"

# 1) Stop the app while we build (ok if not running)
run "npx pm2 stop '${PM2_NAME}' || true"

# 2) Ensure extra swap exists & is active (reduces OOM risk during build)
if ! grep -qs "${SWAPFILE}" /proc/swaps; then
  if [[ -f "${SWAPFILE}" ]]; then
    log "Swapfile ${SWAPFILE} exists but not active — activating…"
    run "sudo swapon '${SWAPFILE}' || true"
  else
    log "Creating ${SWAPSIZE_GB}G swap at ${SWAPFILE}…"
    run "sudo fallocate -l ${SWAPSIZE_GB}G '${SWAPFILE}' || sudo dd if=/dev/zero of='${SWAPFILE}' bs=1M count=$((SWAPSIZE_GB*1024))"
    run "sudo chmod 600 '${SWAPFILE}'"
    run "sudo mkswap '${SWAPFILE}'"
    run "sudo swapon '${SWAPFILE}'"
    log "To persist swap across reboots: echo '${SWAPFILE} none swap sw 0 0' | sudo tee -a /etc/fstab"
  fi
else
  log "Swapfile ${SWAPFILE} already active."
fi

log "Current swap status:"
run "swapon --show || true"

# 3) Build (devDependencies included)
cd "${APP_DIR}"

# Ownership (avoid permission weirdness from earlier runs)
run "sudo chown -R $(whoami):$(whoami) ."

# Clean previous build output
run "rm -rf .next"

# Ensure devDependencies are installed (Tailwind, PostCSS, etc.)
# Force include dev deps regardless of NODE_ENV
log "Installing deps WITH devDependencies… (this may take a bit)"
run "npm ci --production=false --no-audit --prefer-offline"

# Safety: if Tailwind is truly missing (edge case), add it
if [[ ! -d node_modules/tailwindcss ]]; then
  log "Tailwind not found in node_modules. Installing tailwindcss/postcss/autoprefixer as dev deps…"
  run "npm i -D tailwindcss postcss autoprefixer"
fi

# 4) Low-RAM build knobs
export NEXT_TELEMETRY_DISABLED=1
export SWC_WORKER_COUNT=1
export NODE_ENV=production

# Try 1024 MB first; if it fails, retry with 1400 MB
build_once() {
  local heapsize="$1"
  log "Building with NODE_OPTIONS='--max-old-space-size=${heapsize} --heapsnapshot-near-heap-limit=1'…"
  export NODE_OPTIONS="--max-old-space-size=${heapsize} --heapsnapshot-near-heap-limit=1"
  npm run build
}

set +e
build_once 1024
STATUS=$?
if [[ $STATUS -ne 0 ]]; then
  err "Build failed at 1024 MB heap; retrying with 1400 MB…"
  build_once 1400
  STATUS=$?
fi
set -e

if [[ $STATUS -ne 0 ]]; then
  err "Build failed. Check logs above. Aborting."
  exit 1
fi
log "Build complete."

# 5) (Re)start Next via PM2 — bind to loopback; Nginx handles public traffic
run "npx pm2 delete '${PM2_NAME}' || true"
run "npx pm2 start \"npx next start -p ${PORT} -H ${HOST}\" --name '${PM2_NAME}' --cwd '${APP_DIR}' --env production --time"
run "npx pm2 save"

# 6) Quick health checks
log "Verifying Next.js is listening on ${HOST}:${PORT}…"
sleep 2
if ss -ltnp | grep -q ":${PORT}"; then
  log "Listener found on ${HOST}:${PORT}"
else
  err "Nothing is listening on ${HOST}:${PORT} — check PM2 logs."
  run "npx pm2 logs '${PM2_NAME}' --lines 120"
  exit 1
fi

log "curl -> http://127.0.0.1:${PORT}/Exchange"
run "curl -I --max-time 10 \"http://127.0.0.1:${PORT}/Exchange\" || true"

# If Nginx is present, show public checks too
if systemctl is-active --quiet nginx; then
  log "Nginx detected — public health checks:"
  run "curl -I --max-time 10 http://sponsorcoin.org/Exchange || true"
  run "curl -I --max-time 10 https://sponsorcoin.org/Exchange || true"
else
  log "Nginx not active; skipping public checks."
fi

# 7) Status summary
log "PM2 status:"
run "npx pm2 ls"

log "Done. If you see HTTP/1.1 200 OK above, the app is live via Nginx at https://sponsorcoin.org/Exchange"
