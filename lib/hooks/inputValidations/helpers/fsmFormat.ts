// File: lib/hooks/inputValidations/helpers/fsmFormat.ts
'use client';

import { InputState, FEED_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';
import { formatTrace as _formatTrace } from './fsmTraceUtils';

export const SEP_LINE =
  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

export function headerLine(containerType: SP_COIN_DISPLAY, hex: string, feed: FEED_TYPE) {
  return `🧮 ${SP_COIN_DISPLAY[containerType]} for Address ${hex} ${FEED_TYPE[feed]}`;
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

// just re-export naming we already use elsewhere
export const formatTrace = _formatTrace;
