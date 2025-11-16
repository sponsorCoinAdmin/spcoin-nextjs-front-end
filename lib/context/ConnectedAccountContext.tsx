// File: lib/context/ConnectedAccountContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAccount } from 'wagmi';
import type { WalletAccount } from '@/lib/structure';
import { STATUS } from '@/lib/structure';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { getJson } from '@/lib/rest/http';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_CONNECTED_ACCOUNT === 'true';

const debugLog = createDebugLogger(
  'ConnectedAccountContext',
  DEBUG_ENABLED,
  LOG_TIME,
);

const ConnectedAccountContext = createContext<WalletAccount | undefined>(
  undefined,
);

// 🔹 UI-level hook (RecipientSite, etc.)
// Note: this is separate from the ExchangeContext nested hook
export const useConnectedAccount = (): WalletAccount | undefined =>
  useContext(ConnectedAccountContext);

export function ConnectedAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();

  // ✅ Local state again — no dependency on ExchangeContext
  const [connectedAccount, setConnectedAccount] = useState<
    WalletAccount | undefined
  >(undefined);

  useEffect(() => {
    // 🔁 On disconnect / no address:
    //    ➜ DO NOT clear connectedAccount anymore
    //    ➜ Just log and keep the last known value
    if (!isConnected || !address) {
      debugLog.log?.(
        '[ConnectedAccount] disconnect or missing address — preserving previous connectedAccount',
      );
      return;
    }

    const ac = new AbortController();

    (async () => {
      const accountPath = `/assets/accounts/${address}/wallet.json`;

      try {
        const metadata = await getJson<WalletAccount>(accountPath, {
          timeoutMs: 8000,
          retries: 0,
          accept: 'application/json',
          init: {
            signal: ac.signal,
            cache: 'no-store',
          },
        });

        const wallet: WalletAccount = { ...metadata, address };

        if (!ac.signal.aborted) {
          setConnectedAccount(wallet);
          debugLog.log?.(
            '[ConnectedAccount] loaded wallet.json →',
            stringifyBigInt(wallet),
          );
          debugLog.log?.('[ConnectedAccount] website =', wallet.website);
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
          debugLog.log?.(
            '[ConnectedAccount] fallback wallet →',
            stringifyBigInt(fallback),
          );
          debugLog.log?.('[ConnectedAccount] website(fallback) = ""');
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
