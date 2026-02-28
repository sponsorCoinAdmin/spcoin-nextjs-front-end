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
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

import type { spCoinAccount } from '@/lib/structure';
import { STATUS } from '@/lib/structure';
import { loadAccountRecord } from '@/lib/context/accounts/accountStore';
import { createDebugLogger } from '@/lib/utils/debugLogger';

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

export const useActiveAccount = (): spCoinAccount | undefined =>
  useContext(ActiveAccountContext);

export function ActiveAccountProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [activeAccount, setActiveAccount] = useState<
    spCoinAccount | undefined
  >(undefined);

  useEffect(() => {
    if (!isConnected || !address) {
      debugLog.log?.(
        '[ActiveAccount] disconnect or missing address - preserving previous activeAccount',
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const account = (await loadAccountRecord(address)) as spCoinAccount;

        if (!cancelled) {
          setActiveAccount(account);
          debugLog.log?.(
            '[ActiveAccount] loaded account.json ->',
            stringifyBigInt(account),
          );
          debugLog.log?.('[ActiveAccount] website =', account.website);
        }
      } catch {
        const fallback: spCoinAccount = {
          address,
          type: 'ERC20_ACCOUNT',
          description: `Account ${address} not registered on this site`,
          name: '',
          symbol: '',
          website: '',
          status: STATUS.MISSING,
          balance: 0n,
          logoURL: '/assets/miscellaneous/SkullAndBones.png',
        };

        if (!cancelled) {
          setActiveAccount(fallback);
          debugLog.log?.(
            '[ActiveAccount] fallback account ->',
            stringifyBigInt(fallback),
          );
          debugLog.log?.('[ActiveAccount] website(fallback) = ""');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  return (
    <ActiveAccountContext.Provider value={activeAccount}>
      {children}
    </ActiveAccountContext.Provider>
  );
}
