'use client';

import { useRef } from 'react';
import type { Connector } from 'wagmi';
import type { UseConnectReturnType, UseSwitchChainReturnType } from 'wagmi';

type WalletActionsArgs = {
  allowWalletModal: boolean;
  connectors: readonly Connector[]; // ✅ array of Connector, not ReturnType<...>
  connectAsync: UseConnectReturnType['connectAsync']; // ✅ property type directly
  disconnect: () => void;
  switchChainAsync: UseSwitchChainReturnType['switchChainAsync'];
  closeDropdown: () => void;
};

export function useWalletActions({
  allowWalletModal,
  connectors,
  connectAsync,
  disconnect,
  switchChainAsync,
  closeDropdown,
}: WalletActionsArgs) {
  const isBusyRef = useRef(false);

  const connectMetaMask = async (fallbackShow?: () => void) => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    try {
      // Prefer id match, then name fuzzy match
      const mm =
        connectors.find((c) => c.id === 'metaMask') ??
        connectors.find(
          (c) => typeof c.name === 'string' && c.name.toLowerCase().includes('metamask')
        );

      if (mm) {
        await connectAsync({ connector: mm });
      } else if (allowWalletModal) {
        fallbackShow?.();
      }
    } catch (err: any) {
      const code = err?.code ?? err?.cause?.code;
      const name = err?.name ?? err?.cause?.name;
      if (code === 4001 || name === 'UserRejectedRequestError') return; // user canceled
      if (code === -32002) return; // request already pending
      console.error('connectMetaMask failed:', err);
    } finally {
      isBusyRef.current = false;
      closeDropdown();
    }
  };

  const switchTo = async (targetId: number, isConnected?: boolean) => {
    if (!isConnected) return closeDropdown();
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    try {
      await switchChainAsync?.({ chainId: targetId });
    } catch (err: any) {
      const code = err?.code ?? err?.cause?.code;
      const name = err?.name ?? err?.cause?.name;
      if (code === 4001 || name === 'UserRejectedRequestError') return;
      if (code === -32002) return;
      console.error('switchChain failed:', err);
    } finally {
      isBusyRef.current = false;
      closeDropdown();
    }
  };

  return { connectMetaMask, switchTo, disconnect };
}
