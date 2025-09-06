// File: lib/utils/tradeFormat.ts
export const maxInputSz = 28;
export const TYPING_GRACE_MS = 550;

export function clampDisplay(numStr: string, max = maxInputSz): string {
  if (!numStr) return '0';
  if (/[eE][+-]?\d+/.test(numStr)) return numStr.slice(0, max);

  let s = numStr;
  const neg = s.startsWith('-');
  const sign = neg ? '-' : '';
  if (neg) s = s.slice(1);

  let [intPart, fracPart = ''] = s.split('.');
  const intLenWithSign = sign.length + intPart.length;

  if (intLenWithSign >= max) {
    const keep = max - sign.length;
    return sign + intPart.slice(0, Math.max(0, keep));
  }
  const remaining = max - intLenWithSign;
  if (fracPart && remaining > 1) {
    const allowFrac = remaining - 1;
    const fracTrimmed = fracPart.slice(0, allowFrac);
    if (fracTrimmed.length > 0) return sign + intPart + '.' + fracTrimmed;
  }
  return sign + intPart;
}

export const isIntermediateDecimal = (s: string) =>
  s === '.' || /^\d+\.$/.test(s) || /^\d+\.\d*0$/.test(s);
