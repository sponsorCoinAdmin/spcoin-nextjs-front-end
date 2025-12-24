// File: @/lib/context/exchangeContext/panelTree/panelBranchPath.ts
'use client';

import { SP_COIN_DISPLAY } from '@/lib/structure';

type BranchItem = SP_COIN_DISPLAY;

// Navigation-only branch path (per tab runtime).
// DOES NOT affect visibility or persistence.
const BRANCH_PATH: BranchItem[] = [];

const DEBUG =
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_OVERLAY_CLOSE === 'true';

const nameOf = (id: SP_COIN_DISPLAY) => SP_COIN_DISPLAY[id] ?? String(id);

function log(event: string, extra?: Record<string, unknown>) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(`[panelBranchPath] ${event}`, {
    path: BRANCH_PATH.map((p) => ({ id: Number(p), name: nameOf(p) })),
    ...extra,
  });
}

export function branchReset(seed?: SP_COIN_DISPLAY[]) {
  BRANCH_PATH.length = 0;
  if (Array.isArray(seed) && seed.length) {
    for (const p of seed) BRANCH_PATH.push(p);
  }
  log('reset');
}

export function branchSnapshot(): SP_COIN_DISPLAY[] {
  return BRANCH_PATH.slice();
}

/**
 * Push panel onto the branch path.
 * - If already top, do nothing.
 * - Otherwise append.
 */
export function branchPush(panel: SP_COIN_DISPLAY) {
  const top = BRANCH_PATH.length ? BRANCH_PATH[BRANCH_PATH.length - 1] : null;
  if (top !== null && Number(top) === Number(panel)) {
    log('push(skip-same-top)', { panel: nameOf(panel) });
    return;
  }
  BRANCH_PATH.push(panel);
  log('push', { panel: nameOf(panel) });
}

/**
 * Close behavior for navigation only:
 * - If closing the top, pop it.
 * - Else, truncate everything AFTER the last occurrence of panel.
 *
 * This matches “close parent -> revert to previous panel in branch”.
 */
export function branchOnClose(panel: SP_COIN_DISPLAY) {
  if (!BRANCH_PATH.length) {
    log('close(empty)', { panel: nameOf(panel) });
    return;
  }

  const top = BRANCH_PATH[BRANCH_PATH.length - 1];
  if (Number(top) === Number(panel)) {
    BRANCH_PATH.pop();
    log('close(pop-top)', { panel: nameOf(panel) });
    return;
  }

  // Truncate to last occurrence (keep it), so the UI can "revert back".
  for (let i = BRANCH_PATH.length - 1; i >= 0; i--) {
    if (Number(BRANCH_PATH[i]) === Number(panel)) {
      BRANCH_PATH.length = i; // remove the panel itself too (closing it)
      log('close(truncate)', { panel: nameOf(panel), at: i });
      return;
    }
  }

  // If it wasn't in the path, do nothing.
  log('close(no-op-not-in-path)', { panel: nameOf(panel) });
}
