// File: @/lib/context/hooks/selectionCommit/useSelectionCommit.ts
'use client';

import { useCallback } from 'react';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import {
  useSellTokenContract,
  useBuyTokenContract,
  useExchangeContext,
} from '@/lib/context/hooks';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SELECTION_COMMIT === 'true';
const log = createDebugLogger('useSelectionCommit', DEBUG_ENABLED, LOG_TIME);

export type UseSelectionCommit = {
  commitBuyToken: (t: TokenContract) => void;
  commitSellToken: (t: TokenContract) => void;
  commitToken: (t: TokenContract, side: 'buy' | 'sell') => void;

  commitRecipient: (w: WalletAccount) => void;
  commitAgent: (w: WalletAccount) => void;

  finish: () => void; // now only closes the active list panel
};

/** Plain hook that composes ExchangeContext + panel-tree navigation. */
export function useSelectionCommit(): UseSelectionCommit {
  // ✅ closePanel = pop + hide (top-of-stack)
  // ✅ hidePanel = hide a specific panel (visibility-only)
  const { hidePanel, isVisible } = usePanelTree();

  // Token commits use your existing hooks (source of truth)
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  // Recipient/Agent writes
  const { setExchangeContext } = useExchangeContext();

  /**
   * Helper to detect which list-select overlay is currently active.
   * This is the panel we want to close when a selection is committed.
   */
  const getActiveListPanel = useCallback(() => {
    if (typeof isVisible !== 'function') {
      log.warn?.(
        'getActiveListPanel: isVisible is not a function; cannot determine active list panel',
      );
      return null;
    }

    const candidates = [
      SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL,
      SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL,
    ];

    for (const panel of candidates) {
      if (isVisible(panel)) return panel;
    }

    return null;
  }, [isVisible]);

  /**
   * finish:
   * - ONLY closes the currently active list-select overlay (if any)
   * - does NOT pop the stack
   */
  const finish = useCallback(() => {
    const activeList = getActiveListPanel();

    log.log?.('finish invoked', { activeList });

    if (!activeList) {
      log.log?.('finish: no active list-select panel detected; nothing to close');
      return;
    }

    log.log?.('finish → hiding active list-select panel', { activeList });

    // ✅ hide specific panel; do NOT use closePanel(panelId)
    hidePanel(activeList, `useSelectionCommit:finish(hide ${SP_COIN_DISPLAY[activeList]})`);
  }, [getActiveListPanel, hidePanel]);

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
      finish();
    },
    [setBuyTokenContract, finish],
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
      finish();
    },
    [setSellTokenContract, finish],
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
    (w: WalletAccount) => {
      const addr = (w as any)?.address;
      const name = (w as any)?.name;

      if (!w || !addr) {
        log.warn?.('commitRecipient aborted: missing wallet or address', { wallet: w });
        return;
      }

      log.log?.('commitRecipient', { address: addr, name });

      setExchangeContext(
        (prev) => {
          const next: any = structuredClone(prev);
          next.accounts = next.accounts ?? {};
          next.accounts.recipientAccount = w;
          return next;
        },
        'useSelectionCommit:recipient',
      );

      finish();
    },
    [setExchangeContext, finish],
  );

  const commitAgent = useCallback(
    (w: WalletAccount) => {
      const addr = (w as any)?.address;
      const name = (w as any)?.name;

      if (!w || !addr) {
        log.warn?.('commitAgent aborted: missing wallet or address', { wallet: w });
        return;
      }

      log.log?.('commitAgent', { address: addr, name });

      setExchangeContext(
        (prev) => {
          const next: any = structuredClone(prev);
          next.accounts = next.accounts ?? {};
          next.accounts.agentAccount = w;
          return next;
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
