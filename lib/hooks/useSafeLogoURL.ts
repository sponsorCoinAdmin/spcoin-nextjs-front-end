// lib\hooks\useSafeLogoURL.ts
import { useLocalChainId } from '@/lib/context/hooks/nestedHooks/useLocalChainId';
import { isAddress } from 'viem';

export function useSafeLogoURL(address?: string, chainIdOverride?: number, logo?: string): string {
  const fallbackChainId = useLocalChainId();

  if (!address || !isAddress(address)) return '/assets/miscellaneous/QuestionWhiteOnRed.png';
  if (logo) return logo;

  const chainId = chainIdOverride ?? fallbackChainId;
  return `/assets/blockchains/${chainId}/contracts/${address}/logo.png`;
}
