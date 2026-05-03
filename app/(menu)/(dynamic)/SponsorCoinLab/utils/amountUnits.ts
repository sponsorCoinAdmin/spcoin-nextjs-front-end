import { formatUnits, parseUnits } from 'ethers';
import type { ParamDef } from '../jsonMethods/shared/types';

export type AmountUnit = 'RAW' | 'TOKEN';

export const AMOUNT_UNIT_OPTIONS: AmountUnit[] = ['RAW', 'TOKEN'];

export function isAmountParam(param: Pick<ParamDef, 'label' | 'type'> | undefined) {
  const label = String(param?.label || '').trim().toLowerCase();
  if (!label) return false;
  return label.includes('amount') || label.includes('quantity');
}

export function normalizeAmountForMethod(value: string, unit: AmountUnit, decimals: number) {
  const trimmed = String(value || '').replace(/,/g, '').trim();
  if (!trimmed || unit === 'RAW') return trimmed;
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 18;
  return parseUnits(trimmed, safeDecimals).toString();
}

export function normalizeRawAmountInput(value: string) {
  return String(value || '').replace(/[^\d]/g, '');
}

export function normalizeTokenAmountInput(value: string) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  const firstDecimalIndex = cleaned.indexOf('.');
  if (firstDecimalIndex < 0) return cleaned;
  return `${cleaned.slice(0, firstDecimalIndex + 1)}${cleaned
    .slice(firstDecimalIndex + 1)
    .replace(/\./g, '')}`;
}

export function convertAmountDisplayValue(
  value: string,
  fromUnit: AmountUnit,
  toUnit: AmountUnit,
  decimals: number,
) {
  const trimmed = String(value || '').replace(/,/g, '').trim();
  if (!trimmed || fromUnit === toUnit) return trimmed;
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 18;

  if (toUnit === 'RAW') {
    return parseUnits(trimmed, safeDecimals).toString();
  }

  const rawAmount = normalizeRawAmountInput(trimmed);
  if (!rawAmount) return '';
  return formatUnits(BigInt(rawAmount), safeDecimals);
}
