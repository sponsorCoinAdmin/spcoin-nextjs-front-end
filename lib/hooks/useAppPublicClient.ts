// File: lib/hooks/useAppPublicClient.ts
'use client';

import { usePublicClient } from 'wagmi';
import { useAppChainId } from '@/lib/context/hooks';

/** Always returns a publicClient pinned to the app’s canonical chain. */
export function useAppPublicClient() {
  const [appChainId] = useAppChainId();
  // 👇 This is the important part — pass { chainId }
  const publicClient = usePublicClient({ chainId: appChainId });
  return publicClient;
}
