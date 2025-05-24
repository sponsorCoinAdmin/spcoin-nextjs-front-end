// lib\hooks\useSafeAvatarURL.ts

import { useChainId } from 'wagmi';
import { isAddress } from 'viem';

export function useSafeAvatarURL(address?: string, chainIdOverride?: number, avatar?: string): string {
  const fallbackChainId = useChainId();

  if (!address || !isAddress(address)) return '/assets/miscellaneous/QuestionWhiteOnRed.png';
  if (avatar) return avatar;

  const chainId = chainIdOverride ?? fallbackChainId;
  return `/assets/blockchains/${chainId}/contracts/${address}/avatar.png`;
}
