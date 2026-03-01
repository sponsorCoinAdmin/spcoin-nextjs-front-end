import { isAddress as viemIsAddress, type Address } from 'viem';

export function normalizeAddress(input: string): string {
  const trimmed = String(input ?? '').trim();
  if (!/^0x/i.test(trimmed)) return trimmed;
  return `0x${trimmed.slice(2).toLowerCase()}`;
}

export function isAddress(input: string): input is Address {
  return viemIsAddress(normalizeAddress(input));
}

export function toNormalizedAddress(input: string): Address {
  return normalizeAddress(input) as Address;
}
