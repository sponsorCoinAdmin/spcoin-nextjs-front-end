#!/usr/bin/env bash
set -euo pipefail

# Scan for React useEffect hooks and summarize likely centralization candidates.
# - Shows file:line, best-effort dependency array, and detected tags (chainId/account/polling/etc.)
# - Add -s to also print a short code snippet for each match.
# - Add -k "kw1,kw2" to extend keyword detection.
#
# Usage:
#   tools/scan_use_effects.sh                 # scan whole repo
#   tools/scan_use_effects.sh components lib  # scan specific folders
#   tools/scan_use_effects.sh -s              # include snippets
#   tools/scan_use_effects.sh -k "rpc,provider"

SHOW_SNIPPETS=0
EXTRA_KWS=""
TARGETS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--show) SHOW_SNIPPETS=1; shift ;;
    -k|--keywords) EXTRA_KWS="$2"; shift 2 ;;
    *) TARGETS+=("$1"); shift ;;
  esac
done

if [[ ${#TARGETS[@]} -eq 0 ]]; then
  TARGETS=(.)
fi

# Default keywords that often indicate global side-effects worth centralizing
DEFAULT_KWS="chainId,account,address,network,status,provider,signer,wallet,price,prices,balance,balances,allowance,token,contract,poll,setInterval,setTimeout,fetch,AbortController,debounce,throttle,window,document,localStorage,sessionStorage"

IFS=',' read -r -a KW_ARRAY <<< "${DEFAULT_KWS}"
if [[ -n "${EXTRA_KWS}" ]]; then
  IFS=',' read -r -a EXTRA <<< "${EXTRA_KWS}"
  KW_ARRAY+=("${EXTRA[@]}")
fi

# Grep includes/excludes
INCLUDES=(--include '*.ts' --include '*.tsx' --include '*.js' --include '*.jsx')
EXCLUDES=(--exclude-dir node_modules --exclude-dir .next --exclude-dir dist --exclude-dir build)

have_rg() { command -v rg >/dev/null 2>&1; }

# Find all useEffect occurrences
if have_rg; then
  MAPFILE=() # bash readarray target
  while IFS= read -r line; do MAPFILE+=("$line"); done < <(
    rg -n --no-heading "${INCLUDES[@]}" "${EXCLUDES[@]}" 'useEffect\s*\(' "${TARGETS[@]}"
  )
else
  MAPFILE=()
  while IFS= read -r line; do MAPFILE+=("$line"); done < <(
    grep -RIn "${INCLUDES[@]}" "${EXCLUDES[@]}" -E 'useEffect\s*\(' "${TARGETS[@]}" | sed 's/^\.\///'
  )
fi

# Helper: print a short snippet (~15 lines) after a match
print_snippet () {
  local file="$1" line="$2"
  # Use sed to print 0..15 lines from the match line
  sed -n "$((line)),$((line+15))p" "$file"
}

# Helper: best-effort extract dependency array from the next ~12 lines
extract_deps () {
  local file="$1" line="$2"
  # Grab a small chunk and try to find [ ... ] that looks like deps
  local chunk
  chunk="$(sed -n "$((line)),$((line+12))p" "$file")"
  # Grep the first [] block on a line ending with ])
  # (still heuristic, but good enough)
  echo "$chunk" | grep -oE '\[[^]]*\]' | head -n1 | tr -d '\n'
}

# Helper: tag detection based on keywords in the next ~20 lines
detect_tags () {
  local file="$1" line="$2"
  local chunk
  chunk="$(sed -n "$((line)),$((line+20))p" "$file" | tr '[:upper:]' '[:lower:]')"
  local tags=()
  for kw in "${KW_ARRAY[@]}"; do
    local lowkw
    lowkw="$(echo "$kw" | tr '[:upper:]' '[:lower:]' | xargs)"
    [[ -z "$lowkw" ]] && continue
    if echo "$chunk" | grep -q "$lowkw"; then
      # Normalize some tags
      case "$lowkw" in
        chainid) tags+=("chainId");;
        setinterval|settimeout|poll|debounce|throttle) tags+=("polling");;
        price|prices) tags+=("prices");;
        balance|balances) tags+=("balances");;
        allowance) tags+=("allowances");;
        wallet|account|address) tags+=("account");;
        network|provider|signer|rpc) tags+=("network");;
        *) tags+=("$lowkw");;
      esac
    fi
  done
  # Uniq the tags
  printf "%s\n" "${tags[@]}" | awk '!seen[$0]++' | paste -sd',' -
}

sep="--------------------------------------------------------------------------------"

if [[ ${#MAPFILE[@]} -eq 0 ]]; then
  echo "No useEffect hooks found in ${TARGETS[*]}"
  exit 0
fi

echo "Found ${#MAPFILE[@]} useEffect hooks. Scanning…"
echo "$sep"

for entry in "${MAPFILE[@]}"; do
  # entry looks like: path/to/file.tsx:123:  useEffect(...
  file="${entry%%:*}"
  rest="${entry#*:}"
  line="${rest%%:*}"
  [[ ! -f "$file" ]] && continue

  deps="$(extract_deps "$file" "$line")"
  tags="$(detect_tags "$file" "$line")"

  printf "• %s:%s\n" "$file" "$line"
  echo "  deps: ${deps:-<none found>}"
  echo "  tags: ${tags:-<none>}"

  if [[ $SHOW_SNIPPETS -eq 1 ]]; then
    echo "  snippet:"
    print_snippet "$file" "$line" | sed 's/^/    /'
  fi

  echo "$sep"
done

echo "Tip: start consolidating effects tagged with 'chainId', 'account', 'network', 'polling', 'prices', 'balances' into ExchangeProvider."



