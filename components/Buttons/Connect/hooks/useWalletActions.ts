'use client';

import { useRef } from 'react';
import { UseConnectReturnType, UseSwitchChainReturnType } from 'wagmi';

type WalletActionsArgs = {
  allowWalletModal: boolean;
  connectors: ReturnType<UseConnectReturnType['connectors']>;
  connectAsync: UseConnectReturnType['connectAsync'];
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
      const mm =
        connectors.find((c: any) => c.id === 'metaMask') ||
        connectors.find(
          (c: any) =>
            c.type === 'injected' &&
            typeof c.name === 'string' &&
            c.name.toLowerCase().includes('metamask')
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
