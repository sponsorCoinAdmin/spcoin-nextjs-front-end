// File: lib/hooks/inputValidations/helpers/guards.ts
'use client';

import type { MutableRefObject } from 'react';

export function makeSignature(input: string, isValid: boolean): string {
  return `${input}|${isValid ? 1 : 0}`;
}

export function shouldRunFSM(
  prevRef: MutableRefObject<string | undefined>,
  newSignature: string
): boolean {
  return prevRef.current !== newSignature;
}

/** Human-friendly diff string for logging (optional). */
export function signatureDiff(prevSig: string | undefined, nextSig: string): string {
  if (prevSig === undefined) return 'first run';
  const [pIn, pOk = '0'] = prevSig.split('|');
  const [nIn, nOk = '0'] = nextSig.split('|');
  const parts: string[] = [];
  if (pIn !== nIn) parts.push(`debouncedHexInput "${pIn}" → "${nIn}"`);
  if (pOk !== nOk) parts.push(`isValid ${pOk === '1'} → ${nOk === '1'}`);
  return parts.join(' & ');
}
