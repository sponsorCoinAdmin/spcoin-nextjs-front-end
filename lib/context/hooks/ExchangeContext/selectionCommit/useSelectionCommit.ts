// File: lib/context/hooks/selectionCommit/useSelectionCommit.ts
'use client';

import { useCallback } from 'react';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useSellTokenContract, useBuyTokenContract, useExchangeContext } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SELECTION_COMMIT === 'true';
const log = createDebugLogger('useSelectionCommit', DEBUG_ENABLED, LOG_TIME);

export type UseSelectionCommit = {
  commitBuyToken: (t: TokenContract) => void;
  commitSellToken: (t: TokenContract) => void;
  commitToken: (t: TokenContract, side: 'buy' | 'sell') => void;

  commitRecipient: (w: WalletAccount) => void;
  commitAgent: (w: WalletAccount) => void;

  finish: () => void; // navigate back to Trading
};

/** Plain hook that composes ExchangeContext + panel-tree navigation. */
export function useSelectionCommit(): UseSelectionCommit {
  const { openPanel } = usePanelTree();

  // Token commits use your existing hooks (source of truth)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  // Recipient/Agent writes
  const { setExchangeContext } = useExchangeContext();

  const finish = useCallback(() => {
    // DEBUG LOG TO BE REMOVED LATER
    console.log('[useSelectionCommit] finish() → openPanel(TRADING_STATION_PANEL)');
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [openPanel]);

  const commitBuyToken = useCallback(
    (t: TokenContract) => {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitBuyToken START', {
        address: (t as any)?.address,
        symbol: (t as any)?.symbol,
      });

      if (!t || !(t as any)?.address) {
        // DEBUG LOG TO BE REMOVED LATER
        console.warn('[useSelectionCommit] commitBuyToken aborted: missing token or address', t);
        return;
      }

      log.log?.('commitBuyToken', (t as any)?.address);
      setBuyTokenContract(t);

      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitBuyToken DONE → finish()');
      finish();
    },
    [setBuyTokenContract, finish]
  );

  const commitSellToken = useCallback(
    (t: TokenContract) => {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitSellToken START', {
        address: (t as any)?.address,
        symbol: (t as any)?.symbol,
      });

      if (!t || !(t as any)?.address) {
        // DEBUG LOG TO BE REMOVED LATER
        console.warn('[useSelectionCommit] commitSellToken aborted: missing token or address', t);
        return;
      }

      log.log?.('commitSellToken', (t as any)?.address);
      setSellTokenContract(t);

      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitSellToken DONE → finish()');
      finish();
    },
    [setSellTokenContract, finish]
  );

  const commitToken = useCallback(
    (t: TokenContract, side: 'buy' | 'sell') => {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitToken START', {
        side,
        address: (t as any)?.address,
        symbol: (t as any)?.symbol,
      });

      if (side === 'buy') {
        commitBuyToken(t);
      } else {
        commitSellToken(t);
      }

      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitToken END', { side });
    },
    [commitBuyToken, commitSellToken]
  );

  const commitRecipient = useCallback(
    (w: WalletAccount) => {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitRecipient START', {
        address: (w as any)?.address,
        name: (w as any)?.name,
      });

      if (!w || !(w as any)?.address) {
        // DEBUG LOG TO BE REMOVED LATER
        console.warn('[useSelectionCommit] commitRecipient aborted: missing wallet or address', w);
        return;
      }

      log.log?.('commitRecipient', (w as any)?.address);
      setExchangeContext(
        (prev) => {
          const next: any = structuredClone(prev);
          next.accounts = next.accounts ?? {};
          next.accounts.recipientAccount = w;
          return next;
        },
        'useSelectionCommit:recipient'
      );

      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitRecipient DONE → finish()');
      finish();
    },
    [setExchangeContext, finish]
  );

  const commitAgent = useCallback(
    (w: WalletAccount) => {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitAgent START', {
        address: (w as any)?.address,
        name: (w as any)?.name,
      });

      if (!w || !(w as any)?.address) {
        // DEBUG LOG TO BE REMOVED LATER
        console.warn('[useSelectionCommit] commitAgent aborted: missing wallet or address', w);
        return;
      }

      log.log?.('commitAgent', (w as any)?.address);
      setExchangeContext(
        (prev) => {
          const next: any = structuredClone(prev);
          next.accounts = next.accounts ?? {};
          next.accounts.agentAccount = w;
          return next;
        },
        'useSelectionCommit:agent'
      );

      // DEBUG LOG TO BE REMOVED LATER
      console.log('[useSelectionCommit] commitAgent DONE → finish()');
      finish();
    },
    [setExchangeContext, finish]
  );

  return {
    commitBuyToken,
    commitSellToken,
    commitToken,
    commitRecipient,
    commitAgent,
    finish,
  };
}
