// File: lib/context/hooks/selectionCommit/useSelectionCommit.ts
'use client';

import { useCallback } from 'react';
import { TokenContract, WalletAccount, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useSellTokenContract, useBuyTokenContract } from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useExchangeContext } from '@/lib/context/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SELECTION_COMMIT === 'true';
const log = createDebugLogger('useSelectionCommit', DEBUG_ENABLED, LOG_TIME);

export type UseSelectionCommit = {
  commitBuyToken: (t: TokenContract) => void;
  commitSellToken: (t: TokenContract) => void;
  commitToken:     (t: TokenContract, side: 'buy'|'sell') => void;

  commitRecipient: (w: WalletAccount) => void;
  commitAgent:     (w: WalletAccount) => void;

  finish: () => void; // navigate back to Trading
};

/** Plain hook that composes ExchangeContext + panel-tree navigation. */
export function useSelectionCommit(): UseSelectionCommit {
  const { openPanel } = usePanelTree();

  // Token commits use your existing hooks (source of truth)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract]  = useBuyTokenContract();

  // Recipient/Agent writes
  const { setExchangeContext } = useExchangeContext();

  const finish = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [openPanel]);

  const commitBuyToken = useCallback((t: TokenContract) => {
    log.log?.('commitBuyToken', t?.address);
    setBuyTokenContract(t);
    finish();
  }, [setBuyTokenContract, finish]);

  const commitSellToken = useCallback((t: TokenContract) => {
    log.log?.('commitSellToken', t?.address);
    setSellTokenContract(t);
    finish();
  }, [setSellTokenContract, finish]);

  const commitToken = useCallback((t: TokenContract, side: 'buy'|'sell') => {
    if (side === 'buy') commitBuyToken(t);
    else commitSellToken(t);
  }, [commitBuyToken, commitSellToken]);

  const commitRecipient = useCallback((w: WalletAccount) => {
    log.log?.('commitRecipient', w?.address);
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        next.accounts = next.accounts ?? {};
        next.accounts.recipientAccount = w;
        return next;
      },
      'useSelectionCommit:recipient'
    );
    finish();
  }, [setExchangeContext, finish]);

  const commitAgent = useCallback((w: WalletAccount) => {
    log.log?.('commitAgent', w?.address);
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        next.accounts = next.accounts ?? {};
        next.accounts.agentAccount = w;
        return next;
      },
      'useSelectionCommit:agent'
    );
    finish();
  }, [setExchangeContext, finish]);

  return {
    commitBuyToken,
    commitSellToken,
    commitToken,
    commitRecipient,
    commitAgent,
    finish,
  };
}
