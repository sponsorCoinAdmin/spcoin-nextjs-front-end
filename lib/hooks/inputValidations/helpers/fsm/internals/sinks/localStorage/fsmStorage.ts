// File: @/lib/hooks/inputValidations/helpers/fsmStorage.ts
'use client';

import type { InputState } from '@/lib/structure/assetSelection';

import { LATEST_FSM_TRACE_KEY } from '@/lib/context/exchangeContext/localStorageKeys';
export const LOCAL_TRACE_LINES_KEY = 'latestFSMTraceLines';

export function getPrevTrace(): InputState[] {
  try {
    const raw = localStorage.getItem(LATEST_FSM_TRACE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? (parsed as InputState[]) : [];
  } catch {
    return [];
  }
}

export function setTrace(states: InputState[]) {
  localStorage.setItem(LATEST_FSM_TRACE_KEY, JSON.stringify(states));
}

export function getPrevLines(): string {
  try {
    return localStorage.getItem(LOCAL_TRACE_LINES_KEY) || '';
  } catch {
    return '';
  }
}

export function appendLines(lines: string | string[]) {
  const prev = getPrevLines();
  const blockRaw = Array.isArray(lines) ? lines.join('\n') : lines;
  const normalize = (s: string) => s.replace(/\r\n/g, '\n');
  const ensureTrailingNewline = (s: string) => (s.endsWith('\n') ? s : `${s}\n`);

  const prevNorm = prev ? ensureTrailingNewline(normalize(prev)) : '';
  const blockNorm = blockRaw ? ensureTrailingNewline(normalize(blockRaw)) : '';
  const combined = `${prevNorm}${blockNorm}`;

  localStorage.setItem(LOCAL_TRACE_LINES_KEY, combined);
}
