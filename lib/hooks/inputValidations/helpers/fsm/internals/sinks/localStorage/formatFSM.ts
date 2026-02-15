// File: @/lib/hooks/inputValidations/helpers/fsmFormat.ts
'use client';

import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { formatTrace as _formatTrace } from '../../debugFSM';

export const SEP_LINE =
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

// Visible markers for the *intended* (prefix) feed
const FEED_START = '[FEED<<';

// Visible markers for a *trailing* (unexpected) feed appended downstream
const TRAIL_START = '[TRAILING-FEED<<';
const TRAIL_END = '>>]';

/** Public helper so emitters can mark unexpected trailing feed too */
export function markTrailingFeedIfPresent(header: string, feed?: FEED_TYPE): string {
  if (feed == null) return header;
  const label = FEED_TYPE[feed] as string;
  if (!label) return header;

  // Only wrap a *trailing* occurrence not already wrapped
  const rx = new RegExp(`\\s+${label}\\s*$`);
  if (rx.test(header) && !header.includes(TRAIL_START) && !header.includes(FEED_START)) {
    const without = header.replace(rx, ''); // drop the trailing first
    return `${without} ${TRAIL_START}${label}${TRAIL_END}`;
  }
  return header;
}

/**
 * Build header. We show feed first (your preferred look) and wrap it with markers so
 * any extra trailing feed stuck on later will stand out via TRAILING markers.
 *
 * Examples:
 *  🧮 [FEED<<TOKEN_LIST>>] TOKEN_LIST_SELECT_PANEL for Address 0x...
 *  🧮 TOKEN_LIST_SELECT_PANEL for Address 0x...                     (when feed omitted)
 */
export function headerLine(
  containerType: SP_COIN_DISPLAY,
  hex: string,
  feed?: FEED_TYPE
) {
  void feed;
  const header = `🧮 ${SP_COIN_DISPLAY[containerType]} FSM Address: ${hex}`;
  return header;
}

export function warningLine(state: InputState, input: string) {
  return `🟡 ***WARNING*** → ${errorEmoji(state)}${InputState[state]} ${input}`;
}

export function errorEmoji(state: InputState): string {
  switch (state) {
    case InputState.INCOMPLETE_ADDRESS: return '✏️';
    case InputState.INVALID_HEX_INPUT: return '❌';
    case InputState.INVALID_ADDRESS_INPUT: return '❓';
    default: return '❗';
  }
}

// passthrough, unchanged
export const formatTrace = _formatTrace;
