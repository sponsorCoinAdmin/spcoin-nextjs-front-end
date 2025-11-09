// File: lib/debug/panels/panelVisibilityProbe.ts
// (env-gated: zero cost unless you enable NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE or
// NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN)

const DBG =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
    process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true');

export function markPanelOpen(side: 'SELL' | 'BUY') {
  if (!DBG) return;
  (window as any).__lastTokenListOpen = {
    side,
    ts: Date.now(),
    stack: new Error().stack,
  };
  console.groupCollapsed(`[PanelProbe] OPEN requested → ${side}_LIST_SELECT_PANEL`);
  console.log((window as any).__lastTokenListOpen);
  console.groupEnd();
}

export function markPanelClosed(reason: string, detail?: unknown) {
  if (!DBG) return;
  const last = (window as any).__lastTokenListOpen;
  const dt = last ? `${Date.now() - last.ts}ms after open` : 'no prior open mark';
  console.groupCollapsed(`[PanelProbe] CLOSED (${reason}) — ${dt}`);
  if (last) console.log('last open', last);
  if (detail) console.log('detail', detail);
  console.log('close trace:', new Error().stack);
  console.groupEnd();
}

/**
 * markPanelApply — called where the visibility *actually* changes.
 * Keep types lightweight to avoid import cycles.
 */
export function markPanelApply(
  panel: number,                // SP_COIN_DISPLAY enum value (number)
  name: string,                 // SP_COIN_DISPLAY[panel]
  visible: boolean,
  reason?: string
) {
  if (!DBG) return;
  const last = (window as any).__lastTokenListOpen;
  const dt = last ? `${Date.now() - last.ts}ms since last open` : 'n/a';
  const tag = visible ? 'APPLY → OPEN' : 'APPLY → CLOSE';
  console.groupCollapsed(`[PanelProbe] ${tag} ${name} (reason: ${reason ?? 'n/a'})`);
  console.log({ panel, name, visible, reason, sinceOpen: dt });
  if (last) console.log('last open', last);
  console.groupEnd();
}
