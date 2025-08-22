#!/usr/bin/env bash
# Lowercase asset directory names for token/account logos.
# - Dry-run by default. Pass --apply to make changes.
# - Uses `git mv` if inside a Git repo, otherwise falls back to `mv`.
# - Handles case-insensitive filesystems via a two-step rename.
# - Detects collisions (two different casings mapping to the same lowercase).

set -euo pipefail

ROOT="${PWD}"
DRY_RUN=1
[[ "${1:-}" == "--apply" ]] && DRY_RUN=0

CONTRACTS_ROOT="$ROOT/public/assets/blockchains"
ACCOUNTS_ROOT="$ROOT/public/assets/accounts"

log() { printf '%s\n' "$*"; }
info() { printf '%s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }
err () { printf '❌ %s\n' "$*" >&2; }

has_git() { command -v git >/dev/null 2>&1 && [[ -d "$ROOT/.git" ]]; }
mv_cmd() {
  local from="$1"; shift
  local to="$1"; shift
  if [[ $DRY_RUN -eq 1 ]]; then
    info "DRY: mv \"$from\" -> \"$to\""
    return 0
  fi
  if has_git; then
    git mv -f -- "$from" "$to"
  else
    mv -f -- "$from" "$to"
  fi
}

# Resolve a path to a canonical absolute path (best effort, portable).
abspath() {
  # Use Python if realpath -m/-P is not reliable on the host
  python3 - <<'PY' 2>/dev/null || true
import os, sys
p = sys.argv[1] if len(sys.argv)>1 else "."
print(os.path.realpath(p))
PY
  :
}

two_step_rename() {
  local from="$1" ; local to="$2"
  if [[ "$from" == "$to" ]]; then
    return 0
  fi
  local tmp="${from}.__tmp_lowercase__$$"
  info "  → rename (two-step):"
  info "     1) $from"
  info "        -> $tmp"
  mv_cmd "$from" "$tmp"
  info "     2) $tmp"
  info "        -> $to"
  mv_cmd "$tmp" "$to"
}

process_parent_dirs() {
  local parent="$1"    # parent directory whose immediate children we lowercase
  local label="$2"     # log label
  [[ -d "$parent" ]] || { warn "$label: '$parent' not found, skipping"; return 0; }

  info "• Scanning: $parent ($label)"
  shopt -s nullglob
  local children=( "$parent"/* )
  shopt -u nullglob
  [[ ${#children[@]} -eq 0 ]] && { info "  (no directories)"; return 0; }

  # Build a map for collision detection: lowercase -> original[]
  declare -A buckets=()
  local child base lower
  for child in "${children[@]}"; do
    [[ -d "$child" ]] || continue
    base="$(basename -- "$child")"
    lower="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
    # append to bucket
    buckets["$lower"]="${buckets["$lower"]}|$base"
  done

  # warn on collisions
  for lower in "${!buckets[@]}"; do
    IFS='|' read -r _first rest <<<"${buckets[$lower]}"
    # Count variants
    IFS='|' read -ra variants <<<"${buckets[$lower]}"
    # remove empty leading chunk
    local cleaned=()
    for v in "${variants[@]}"; do
      [[ -n "$v" ]] && cleaned+=( "$v" )
    done
    if (( ${#cleaned[@]} > 1 )); then
      warn "Collision in '$parent': ${cleaned[*]} → ${lower}. Resolve manually; skipping these."
    fi
  done

  local renamed=0
  for child in "${children[@]}"; do
    [[ -d "$child" ]] || continue
    base="$(basename -- "$child")"
    lower="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"

    # Skip if already lowercase
    if [[ "$base" == "$lower" ]]; then
      continue
    fi

    local target="$parent/$lower"

    # Collision: if target exists and is NOT the same dir, skip
    if [[ -e "$target" ]]; then
      local r_from r_to
      r_from="$(abspath "$child")"
      r_to="$(abspath "$target" || true)"

      if [[ -n "$r_to" && "$r_from" != "$r_to" ]]; then
        warn "Skipping '$child' → '$target' (real collision: target exists)"
        continue
      fi
      # else: same inode (case-only rename), proceed with two-step
    fi

    info "Renaming: $base → $lower"
    two_step_rename "$child" "$target"
    ((renamed++))
  done

  info "  → $label: $renamed renamed.\n"
}

process_contracts() {
  [[ -d "$CONTRACTS_ROOT" ]] || { warn "Contracts root not found: $CONTRACTS_ROOT"; return 0; }
  shopt -s nullglob
  local chains=( "$CONTRACTS_ROOT"/* )
  shopt -u nullglob
  for chain in "${chains[@]}"; do
    [[ -d "$chain/contracts" ]] || continue
    process_parent_dirs "$chain/contracts" "contracts for chain $(basename -- "$chain")"
  done
}

process_accounts() {
  process_parent_dirs "$ACCOUNTS_ROOT" "accounts"
}

main() {
  if [[ $DRY_RUN -eq 1 ]]; then
    info "��� Dry run (no changes will be made). Pass --apply to perform renames.\n"
  else
    info "✍️  APPLY mode (will rename using $(has_git && echo 'git mv' || echo 'mv')).\n"
  fi

  process_contracts
  process_accounts

  if [[ $DRY_RUN -eq 1 ]]; then
    info "✅ Dry run complete. No files changed."
  else
    info "✅ Renames applied. Review with: git status"
  fi
}

main "$@"
