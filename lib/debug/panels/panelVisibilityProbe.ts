// File: lib/debug/panels/panelVisibilityProbe.ts
// (env-gated, zero-cost in prod unless you enable the flags)

const DBG = typeof window !== 'undefined'
  && (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true'
   || process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true');

export function markPanelOpen(side: 'SELL' | 'BUY') {
  if (!DBG) return;
  (window as any).__lastTokenListOpen = { side, ts: Date.now(), stack: new Error().stack };
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
  // Full stack of *who triggered this code path*:
  console.log('close trace:', new Error().stack);
  console.groupEnd();
}
