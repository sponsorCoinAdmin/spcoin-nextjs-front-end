// File: @/lib/context/ActiveAccountContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAccount } from 'wagmi';
import type { spCoinAccount } from '@/lib/structure';
import { STATUS } from '@/lib/structure';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { getJson } from '@/lib/rest/http';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getWalletJsonURL } from '@/lib/context/helpers/assetHelpers';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_CONNECTED_ACCOUNT === 'true';

const debugLog = createDebugLogger(
  'ActiveAccountContext',
  DEBUG_ENABLED,
  LOG_TIME,
);

const ActiveAccountContext = createContext<spCoinAccount | undefined>(
  undefined,
);

// 🔹 UI-level hook (RecipientSite, etc.)
// Note: this is separate from the ExchangeContext nested hook
export const useActiveAccount = (): spCoinAccount | undefined =>
  useContext(ActiveAccountContext);

export function ActiveAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();

  // ✅ Local state again — no dependency on ExchangeContext
  const [activeAccount, setActiveAccount] = useState<
    spCoinAccount | undefined
  >(undefined);

  useEffect(() => {
    // 🔁 On disconnect / no address:
    //    ➜ DO NOT clear activeAccount anymore
    //    ➜ Just log and keep the last known value
    if (!isConnected || !address) {
      debugLog.log?.(
        '[ActiveAccount] disconnect or missing address — preserving previous activeAccount',
      );
      return;
    }

    const ac = new AbortController();

    (async () => {
      // Use centralized helper so address casing & path are consistent
      const accountPath = getWalletJsonURL(address);

      if (!accountPath) {
        debugLog.warn?.(
          '[ActiveAccount] getWalletJsonURL returned empty path',
        );
        return;
      }

      try {
        const metadata = await getJson<spCoinAccount>(accountPath, {
          timeoutMs: 8000,
          retries: 0,
          accept: 'application/json',
          init: {
            signal: ac.signal,
            cache: 'no-store',
          },
        });

        const wallet: spCoinAccount = { ...metadata, address };

        if (!ac.signal.aborted) {
          setActiveAccount(wallet);
          debugLog.log?.(
            '[ActiveAccount] loaded wallet.json →',
            stringifyBigInt(wallet),
          );
          debugLog.log?.('[ActiveAccount] website =', wallet.website);
        }
      } catch {
        const fallback: spCoinAccount = {
          address,
          type: 'ERC20_WALLET',
          description: `Account ${address} not registered on this site`,
          name: '',
          symbol: '',
          website: '',
          status: STATUS.MISSING,
          balance: 0n,
          // This is a static error icon, not address-based, so it stays literal
          logoURL: '/assets/miscellaneous/SkullAndBones.png',
        };

        if (!ac.signal.aborted) {
          setActiveAccount(fallback);
          debugLog.log?.(
            '[ActiveAccount] fallback wallet →',
            stringifyBigInt(fallback),
          );
          debugLog.log?.('[ActiveAccount] website(fallback) = ""');
        }
      }
    })();

    return () => ac.abort();
  }, [address, isConnected]);

  return (
    <ActiveAccountContext.Provider value={activeAccount}>
      {children}
    </ActiveAccountContext.Provider>
  );
}
