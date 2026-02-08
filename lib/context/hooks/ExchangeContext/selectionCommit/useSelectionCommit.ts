// File: @/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit.ts
'use client';

import { useCallback } from 'react';
import type { TokenContract, spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
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

  commitRecipient: (w: spCoinAccount) => void;
  commitAgent: (w: spCoinAccount) => void;

  finish: () => void; // closes via stack POP (header-close behavior)
};

/** Plain hook that composes ExchangeContext + panel-tree navigation. */
export function useSelectionCommit(): UseSelectionCommit {
  // ✅ closeTop = POP top-of-stack (same as header X)
  const { closeTop } = usePanelTransitions();
  const { openPanel } = usePanelTree();

  // Token commits use your existing hooks (source of truth)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  // Recipient/Agent writes
  const { setExchangeContext } = useExchangeContext();

  /**
   * finish:
   * - behaves like header close: POP the stack (closes active list overlay)
   */
  const finish = useCallback(() => {
    log.log?.('finish invoked → closeTop(pop)');
    closeTop('useSelectionCommit:finish(pop)');
  }, [closeTop]);

  const commitBuyToken = useCallback(
    (t: TokenContract) => {
      const addr = (t as any)?.address;
      const sym = (t as any)?.symbol;

      if (!t || !addr) {
        log.warn?.('commitBuyToken aborted: missing token or address', { token: t });
        return;
      }

      log.log?.('commitBuyToken', { address: addr, symbol: sym });
      setBuyTokenContract(t);
      openPanel(SP_COIN_DISPLAY.BUY_TOKEN, 'useSelectionCommit:commitBuyToken');
      openPanel(
        SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
        'useSelectionCommit:commitBuyToken',
      );
      finish();
    },
    [setBuyTokenContract, openPanel, finish],
  );

  const commitSellToken = useCallback(
    (t: TokenContract) => {
      const addr = (t as any)?.address;
      const sym = (t as any)?.symbol;

      if (!t || !addr) {
        log.warn?.('commitSellToken aborted: missing token or address', { token: t });
        return;
      }

      log.log?.('commitSellToken', { address: addr, symbol: sym });
      setSellTokenContract(t);
      openPanel(SP_COIN_DISPLAY.SELL_TOKEN, 'useSelectionCommit:commitSellToken');
      openPanel(
        SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL,
        'useSelectionCommit:commitSellToken',
      );
      finish();
    },
    [setSellTokenContract, openPanel, finish],
  );

  const commitToken = useCallback(
    (t: TokenContract, side: 'buy' | 'sell') => {
      log.log?.('commitToken', {
        side,
        address: (t as any)?.address,
        symbol: (t as any)?.symbol,
      });

      if (side === 'buy') commitBuyToken(t);
      else commitSellToken(t);
    },
    [commitBuyToken, commitSellToken],
  );

  const commitRecipient = useCallback(
    (w: spCoinAccount) => {
      const addr = (w as any)?.address;
      const name = (w as any)?.name;

      if (!w || !addr) {
        log.warn?.('commitRecipient aborted: missing wallet or address', { wallet: w });
        return;
      }

      log.log?.('commitRecipient', { address: addr, name });

      setExchangeContext(
        (prev: any) => {
          const prevEx = prev?.exchangeContext ?? prev;
          const prevAccounts = prevEx?.accounts ?? {};

          const writeAccounts = {
            ...prevAccounts,
            recipientAccount: w,
          };

          // ✅ Preserve both shapes (nested vs root)
          if (prev?.exchangeContext) {
            return {
              ...prev,
              exchangeContext: {
                ...prev.exchangeContext,
                accounts: writeAccounts,
              },
            };
          }

          return {
            ...prev,
            accounts: writeAccounts,
          };
        },
        'useSelectionCommit:recipient',
      );

      finish();
    },
    [setExchangeContext, finish],
  );

  const commitAgent = useCallback(
    (w: spCoinAccount) => {
      const addr = (w as any)?.address;
      const name = (w as any)?.name;

      if (!w || !addr) {
        log.warn?.('commitAgent aborted: missing wallet or address', { wallet: w });
        return;
      }

      log.log?.('commitAgent', { address: addr, name });

      setExchangeContext(
        (prev: any) => {
          const prevEx = prev?.exchangeContext ?? prev;
          const prevAccounts = prevEx?.accounts ?? {};

          const writeAccounts = {
            ...prevAccounts,
            agentAccount: w,
          };

          // ✅ Preserve both shapes (nested vs root)
          if (prev?.exchangeContext) {
            return {
              ...prev,
              exchangeContext: {
                ...prev.exchangeContext,
                accounts: writeAccounts,
              },
            };
          }

          return {
            ...prev,
            accounts: writeAccounts,
          };
        },
        'useSelectionCommit:agent',
      );

      finish();
    },
    [setExchangeContext, finish],
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
