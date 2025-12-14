// File: @/components/views/UnstakingSpCoins.tsx
'use client';

import React, { useEffect, useContext, useCallback } from 'react';
import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
  type TokenContract,
  LIST_TYPE,
} from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import PanelListSelectWrapper from '@/components/containers/AssetSelectPanels/PanelListSelectWrapper';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_UNSTAKING_SPCOINS === 'true';

const debugLog = createDebugLogger('UnstakingSpCoins', DEBUG_ENABLED, LOG_TIME);

/**
 * Unstaking SP Coins panel
 *
 * IMPORTANT:
 * - This component MUST gate its render by its own visibility; otherwise the list wrapper
 *   mounts even when the overlay is closed, which can cause confusing UI/state behavior.
 */
export default function UnstakingSpCoins() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL);

  useEffect(() => {
    debugLog.log?.('[visibility] UNSTAKING_SPCOINS_PANEL', { visible });
  }, [visible]);

  if (!visible) return null;
  return <UnstakingSpCoinsInner />;
}

function UnstakingSpCoinsInner() {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  const handleCommit = useCallback(
    (asset: WalletAccount | TokenContract) => {
      // NOTE: This file was copied from a sponsor list panel previously.
      // We keep the handler lightweight + safe until the correct Unstaking feed/commit target is wired.
      const isToken = typeof (asset as any)?.decimals === 'number';

      debugLog.log?.('[handleCommit]', {
        isToken,
        assetPreview: {
          address: (asset as any)?.address,
          name: (asset as any)?.name,
        },
      });

      // If you later decide this panel should only accept tokens or only wallets,
      // enforce that here. For now we only log + no-op on tokens.
      if (isToken) return;

      const wallet = asset as WalletAccount;

      // Example commit target (adjust to your actual unstaking flow):
      // Store a selected wallet/account in context so the next step knows what to act on.
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccount: wallet, // TODO: replace with the correct target for unstaking
            },
          };
        },
        'UnstakingSpCoins:handleCommit(selectedAccount)'
      );

      // If unstaking has a follow-up detail panel, open it here.
      // Leaving MANAGE_SPONSOR_PANEL as a placeholder would be wrong, so we no-op by default.
      // openPanel(SP_COIN_DISPLAY.<YOUR_DETAIL_PANEL>, 'UnstakingSpCoins:handleCommit(open detail)');
      void openPanel;
    },
    [ctx, openPanel]
  );

  debugLog.log?.('[inner] mounting PanelListSelectWrapper', {
    panel: 'UNSTAKING_SPCOINS_PANEL',
    feedType: 'SPONSOR_ACCOUNTS (placeholder)',
    instancePrefix: 'unstaking',
  });

  return (
    <PanelListSelectWrapper
      panel={SP_COIN_DISPLAY.UNSTAKING_SPCOINS_PANEL}
      // TODO: swap to the correct FEED_TYPE for unstaking when available.
      feedType={FEED_TYPE.SPONSOR_ACCOUNTS}
      listType={LIST_TYPE.SPONSOR_UNSPONSOR}
      instancePrefix="unstaking"
      onCommit={handleCommit} 
      />
  );
}
