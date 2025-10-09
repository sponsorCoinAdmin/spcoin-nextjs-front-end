// File: components/containers/AssetSelectPanels/RecipientListSelectPanel.tsx
'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { TokenContract, SP_COIN_DISPLAY, WalletAccount } from '@/lib/structure';
import AssetListSelectPanel from './AssetListSelectPanel';
import { useExchangeContext } from '@/lib/context/hooks';
import { AssetSelectProvider } from '@/lib/context';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_SELECT_PANEL === 'true';
const debug = createDebugLogger('RecipientListSelectPanel', DEBUG_ENABLED, LOG_TIME);

/** Wrapper: only visibility gating; no hooks after the conditional. */
export default function RecipientListSelectPanel() {
  const visible = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL);
  if (!visible) return null;
  return <RecipientListSelectPanelInner />;
}

/** Inner: stable hooks only, no early returns. */
function RecipientListSelectPanelInner() {
  const { exchangeContext } = useExchangeContext();
  const { commitRecipient } = useSelectionCommit();
  const { toTrading } = usePanelTransitions();

  // ✅ ensure we pass a real chainId into the panel bag
  const chainId = exchangeContext?.network?.chainId ?? 1;
  const containerType = SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL;

  const instanceId = useMemo(
    () => `RECIPIENT_SELECT_${SP_COIN_DISPLAY[containerType]}_${chainId}`,
    [containerType, chainId]
  );

  useEffect(() => {
    debug.log('🧩 mount', { instanceId, chainId, containerType });
  }, [instanceId, chainId, containerType]);

  // ✅ match provider signature: (fromUser?: boolean) => void
  const closeForProvider = useCallback((fromUser?: boolean) => {
    debug.log('🔚 closeForProvider → toTrading()', { fromUser });
    toTrading();
  }, [toTrading]);

  // ✅ Commit a WalletAccount (NOT a token). Tokens have a numeric `decimals`.
  const onAssetChosen = useCallback(
    (asset: TokenContract | WalletAccount) => {
      const looksLikeToken = typeof (asset as any)?.decimals === 'number';
      debug.log('🖱️ onAssetChosen', {
        looksLikeToken,
        assetPreview: {
          name: (asset as any)?.name,
          symbol: (asset as any)?.symbol,
          address: (asset as any)?.address,
          logoURL: (asset as any)?.logoURL,
          decimals: (asset as any)?.decimals,
        },
      });

      if (looksLikeToken) {
        debug.warn('⛔ Selected a token in recipient panel—ignoring.');
        return;
      }

      // Publish full recipient record to Exchange Context
      commitRecipient(asset as WalletAccount);
      debug.log('✅ commitRecipient called');

      // Optional: inspect context on next tick
      setTimeout(() => {
        const snapshot = { accounts: { ...(exchangeContext?.accounts ?? {}) } };
        (window as any).__lastExchangeCtxSnapshot = snapshot;
        debug.log('🔎 post-commit ctx snapshot', snapshot);
      }, 0);

      // Return to trading after a successful selection (mirrors token panels)
      toTrading();
    },
    [commitRecipient, exchangeContext?.accounts, toTrading]
  );

  const initialPanelBag: AssetSelectBag = useMemo(
    () => ({ type: containerType, chainId }),
    [containerType, chainId]
  );

  return (
    <AssetSelectDisplayProvider instanceId={instanceId}>
      <AssetSelectProvider
        key={instanceId}
        closePanelCallback={closeForProvider}
        setSelectedAssetCallback={onAssetChosen}
        containerType={containerType}
        initialPanelBag={initialPanelBag}
      >
        <AssetListSelectPanel />
      </AssetSelectProvider>
    </AssetSelectDisplayProvider>
  );
}
