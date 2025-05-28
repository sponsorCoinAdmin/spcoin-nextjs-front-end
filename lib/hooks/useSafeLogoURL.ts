// lib\hooks\useSafeLogoURL.ts

import { useChainId } from 'wagmi';
import { isAddress } from 'viem';

export function useSafeLogoURL(address?: string, chainIdOverride?: number, logo?: string): string {
  const fallbackChainId = useChainId();

  if (!address || !isAddress(address)) return '/assets/miscellaneous/QuestionWhiteOnRed.png';
  if (logo) return logo;

  const chainId = chainIdOverride ?? fallbackChainId;
  return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
}
