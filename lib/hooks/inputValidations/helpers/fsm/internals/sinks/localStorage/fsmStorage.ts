// File: lib/hooks/inputValidations/helpers/fsmStorage.ts
'use client';

import { InputState } from '@/lib/structure/assetSelection';

export const LOCAL_TRACE_KEY = 'latestFSMTrace';
export const LOCAL_TRACE_LINES_KEY = 'latestFSMTraceLines';

export function getPrevTrace(): InputState[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRACE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? (parsed as InputState[]) : [];
  } catch {
    return [];
  }
}

export function setTrace(states: InputState[]) {
  localStorage.setItem(LOCAL_TRACE_KEY, JSON.stringify(states));
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
  const block = Array.isArray(lines) ? lines.join('\n') : lines;
  const combined = [prev, block].filter(Boolean).join('\n');
  localStorage.setItem(LOCAL_TRACE_LINES_KEY, combined);
}
