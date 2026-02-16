// File: @/lib/network/initialize/appNetworkController.tsx
'use client';

import { useNetworkController } from '@/lib/utils/network/hooks';

export function AppNetworkController() {
  // This hook applies Cases A–E:
  // - LS empty + disconnected  → appChainId = 1
  // - LS empty + connected     → appChainId = walletChainId
  // - LS available + connected → appChainId from LS, switch wallet
  // - On connect               → switch wallet to appChainId
  useNetworkController();
  return null;
}
