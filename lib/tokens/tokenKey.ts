import type { TokenContract } from '@/lib/structure';

export function normalizeTokenAddressKey(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase();
}

export function getTokenChainId(token: unknown): number | undefined {
  const chainId =
    token && typeof token === 'object' ? Number((token as any).chainId ?? 0) : 0;
  return Number.isFinite(chainId) && chainId > 0 ? chainId : undefined;
}

export function getTokenAddress(token: unknown): `0x${string}` | undefined {
  const address =
    token && typeof token === 'object' && typeof (token as any).address === 'string'
      ? String((token as any).address).trim()
      : '';
  return address ? (address as `0x${string}`) : undefined;
}

export function toPersistedTokenRef(
  token: unknown,
): TokenContract | undefined {
  const chainId = getTokenChainId(token);
  const address = getTokenAddress(token);
  return chainId && address
    ? ({ chainId, address } as TokenContract)
    : undefined;
}

export function normalizeTokenCompositeKey(
  chainId: unknown,
  address: unknown,
): string {
  const chain = Number(chainId ?? 0);
  const addr = normalizeTokenAddressKey(address);
  if (!Number.isFinite(chain) || chain <= 0 || !addr) return '';
  return `${chain}:${addr}`;
}
