// File: lib/debug/panels/installDocClickProbe.ts
'use client';

let installed = false;

export function installDocClickProbe() {
  if (installed) return;
  installed = true;

  const DBG =
    typeof window !== 'undefined' &&
    (process.env.NEXT_PUBLIC_DEBUG_LOG_PANEL_TREE === 'true' ||
     process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true');

  if (!DBG) return; // zero-cost when flags are off

  const onMouseDown = (e: MouseEvent) => {
    // Record who closed things, with a stack
    (window as any).__lastDocMouseDown = {
      targetId: (e.target as HTMLElement | null)?.id ?? 'unknown',
      ts: Date.now(),
      stack: new Error().stack,
    };
    // Keep logging minimal but useful
    // console.log('[DocClickProbe] mousedown on', (e.target as HTMLElement)?.id);
  };

  document.addEventListener('mousedown', onMouseDown, true);

  // Optional: clean up if the page hot-reloads in dev
  if (import.meta && (import.meta as any).hot) {
    (import.meta as any).hot.dispose(() => {
      document.removeEventListener('mousedown', onMouseDown, true);
      installed = false;
    });
  }
}
