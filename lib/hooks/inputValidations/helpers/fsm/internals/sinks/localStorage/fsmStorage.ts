// File: @/lib/hooks/inputValidations/helpers/fsmStorage.ts
'use client';

import type { InputState } from '@/lib/structure/assetSelection';
import { SEP_LINE } from './formatFSM';
import { LAST_FSM_TRACE_KEY } from '@/lib/context/exchangeContext/localStorageKeys';

const LEGACY_TRACE_LINES_KEY = 'latestFSMTraceLines';
export const LOCAL_TRACE_LINES_KEY = LAST_FSM_TRACE_KEY;

export function getPrevLines(): string {
  try {
    const next = localStorage.getItem(LOCAL_TRACE_LINES_KEY);
    if (next) return next;

    // One-way fallback from old key name.
    const legacy = localStorage.getItem(LEGACY_TRACE_LINES_KEY) || '';
    if (legacy) {
      localStorage.setItem(LOCAL_TRACE_LINES_KEY, legacy);
      localStorage.removeItem(LEGACY_TRACE_LINES_KEY);
    }
    return legacy;
  } catch {
    return '';
  }
}

function normalize(s: string) {
  return s.replace(/\r\n/g, '\n');
}

function ensureTrailingNewline(s: string) {
  return s.endsWith('\n') ? s : `${s}\n`;
}

export function setLines(lines: string) {
  const normalized = normalize(lines);
  localStorage.setItem(
    LOCAL_TRACE_LINES_KEY,
    normalized ? ensureTrailingNewline(normalized) : '',
  );
}

export function setFirstLine(firstLine: string) {
  const current = normalize(getPrevLines());
  const lines = current ? current.split('\n') : [];

  // Replace the entire existing top header block (everything before first divider),
  // then keep the remainder as-is.
  const firstSepIdx = lines.indexOf(SEP_LINE);
  const rest =
    firstSepIdx >= 0 ? lines.slice(firstSepIdx + 1).join('\n').trimStart() : current.trimStart();

  const header = normalize(firstLine).replace(/\n+$/g, '');
  const top = `${header}\n${SEP_LINE}`;
  setLines(rest ? `${top}\n${rest}` : top);
}

export function appendLines(lines: string | string[]) {
  const prev = getPrevLines();
  const blockRaw = Array.isArray(lines) ? lines.join('\n') : lines;

  const prevNorm = prev ? ensureTrailingNewline(normalize(prev)) : '';
  const blockNorm = blockRaw ? ensureTrailingNewline(normalize(blockRaw)) : '';
  const combined = `${prevNorm}${blockNorm}`;

  localStorage.setItem(LOCAL_TRACE_LINES_KEY, combined);
}
