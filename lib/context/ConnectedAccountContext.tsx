// File: lib/context/ConnectedAccountContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import type { WalletAccount } from '@/lib/structure';
import { STATUS } from '@/lib/structure';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const ConnectedAccountContext = createContext<WalletAccount | undefined>(undefined);
export const useConnectedAccount = (): WalletAccount | undefined => useContext(ConnectedAccountContext);

const DEBUG_CONNECTED = process.env.NEXT_PUBLIC_DEBUG_CONNECTED_ACCOUNT === 'true';

export function ConnectedAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [connectedAccount, setConnectedAccount] = useState<WalletAccount | undefined>(undefined);

  useEffect(() => {
    if (!isConnected || !address) {
      setConnectedAccount(undefined);
      if (DEBUG_CONNECTED) console.debug('[ConnectedAccount] cleared (disconnected or no address)');
      return;
    }

    const ac = new AbortController();

    (async () => {
      const accountPath = `/assets/accounts/${address}/wallet.json`;
      try {
        const res = await fetch(accountPath, { signal: ac.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('File not found');

        const metadata = await res.json();
        const wallet: WalletAccount = { ...metadata, address };

        if (!ac.signal.aborted) {
          setConnectedAccount(wallet);
          if (DEBUG_CONNECTED) {
            console.debug('[ConnectedAccount] loaded wallet.json →', stringifyBigInt(wallet));
            console.debug('[ConnectedAccount] website =', wallet.website);
          }
        }
      } catch {
        const fallback: WalletAccount = {
          address,
          type: 'ERC20_WALLET',
          description: `Account ${address} not registered on this site`,
          name: '',
          symbol: '',
          website: '',
          status: STATUS.MISSING,
          balance: 0n,
          logoURL: '/assets/miscellaneous/SkullAndBones.png',
        };
        if (!ac.signal.aborted) {
          setConnectedAccount(fallback);
          if (DEBUG_CONNECTED) {
            console.debug('[ConnectedAccount] fallback wallet →', stringifyBigInt(fallback));
            console.debug('[ConnectedAccount] website(fallback) = ""');
          }
        }
      }
    })();

    return () => ac.abort();
  }, [address, isConnected]);

  return (
    <ConnectedAccountContext.Provider value={connectedAccount}>
      {children}
    </ConnectedAccountContext.Provider>
  );
}
