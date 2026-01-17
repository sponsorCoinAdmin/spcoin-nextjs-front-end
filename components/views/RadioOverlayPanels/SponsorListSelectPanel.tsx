// File: @/components/views/ManageSponsorships/ManageSponsorRecipients.tsx
'use client';

import React, { useCallback, useEffect, useContext, useMemo } from 'react';

import { FEED_TYPE, SP_COIN_DISPLAY, LIST_TYPE, type WalletAccount } from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import AccountListPanel from '@/components/views/AccountListPanel';

// ✅ Provide the context AddressSelect expects (without going through the old wrapper)
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('ManageSponsorRecipients', DEBUG_ENABLED, LOG_TIME);

export default function ManageSponsorRecipients() {
  const vClaim = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);
  const vSponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);

  const activePanel: SP_COIN_DISPLAY | null = vClaim
    ? SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL
    : null;

  useEffect(() => {
    debugLog.log?.('[visibility]', {
      vClaim,
      vSponsorDetail,
      activePanel: activePanel != null ? SP_COIN_DISPLAY[activePanel] : null,
    });
  }, [vClaim, vSponsorDetail, activePanel]);

  if (!activePanel) return null;

  // ✅ If detail is open, do NOT render the list UI.
  if (vSponsorDetail) return null;

  return <ManageSponsorRecipientsInner activePanel={activePanel} />;
}

function ManageSponsorRecipientsInner({
  activePanel,
}: {
  activePanel: SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;
}) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  // ✅ UNSTAKING removed: listType is always claim rewards for this component
  const listType = LIST_TYPE.SPONSOR_CLAIM_REWARDS;

  // ✅ Directly load sponsor accounts (same source as before)
  const { feedData, loading, error } = useFeedData(FEED_TYPE.SPONSOR_ACCOUNTS);

  const wallets: WalletAccount[] = useMemo(() => {
    const anyData: any = feedData;
    return Array.isArray(anyData?.wallets) ? (anyData.wallets as WalletAccount[]) : [];
  }, [feedData]);

  useEffect(() => {
    debugLog.log?.('[data]', {
      activePanel: SP_COIN_DISPLAY[activePanel],
      listType: LIST_TYPE[listType],
      loading,
      error: error ?? null,
      walletsLen: wallets.length,
      sourceId: (feedData as any)?.__sourceId ?? '(missing __sourceId)',
      sourceKind: (feedData as any)?.__sourceKind ?? '(missing __sourceKind)',
    });
  }, [activePanel, listType, loading, error, wallets.length, feedData]);

  const setWalletCallBack = useCallback(
    (wallet?: WalletAccount) => {
      if (!wallet?.address) {
        debugLog.log?.('[setWalletCallBack] ignored (no wallet/address)', { wallet });
        return;
      }

      debugLog.log?.('[setWalletCallBack]', {
        activePanel: SP_COIN_DISPLAY[activePanel],
        listType: LIST_TYPE[listType],
        addressPreview: String(wallet.address).slice(0, 12),
        name: (wallet as any)?.name,
      });

      // 1) Store selected wallet in ExchangeContext
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccount: wallet,
            },
          };
        },
        `ManageSponsorRecipients:setWalletCallBack(${SP_COIN_DISPLAY[activePanel]}:sponsorAccount)`,
      );

      // 2) Open sponsor detail panel
      openPanel(
        SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
        `ManageSponsorRecipients:setWalletCallBack(open SPONSOR_ACCOUNT_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
        activePanel,
      );
    },
    [activePanel, ctx, listType, openPanel],
  );

  // Minimal render states (feel free to style later)
  if (loading) {
    return (
      <div id="ManageSponsorRecipients" className="p-3 text-sm opacity-70">
        Loading sponsor accounts…
      </div>
    );
  }

  if (error) {
    return (
      <div id="ManageSponsorRecipients" className="p-3 text-sm opacity-70">
        Failed to load sponsor accounts: {error}
      </div>
    );
  }

  /**
   * ✅ Key point:
   * Wrap AccountListPanel so AddressSelect has AssetSelectContext.
   *
   * We keep callbacks as no-ops / pass-through because we aren’t using the FSM
   * commit path here anymore — AccountListPanel clicks are handled by setWalletCallBack.
   */
  return (
    <div id="ManageSponsorRecipients">
      <AssetSelectDisplayProvider>
        <AssetSelectProvider
          containerType={activePanel}
          feedTypeOverride={FEED_TYPE.SPONSOR_ACCOUNTS}
          closePanelCallback={() => {
            /* no-op: this list is controlled by the overlay system */
          }}
          setSelectedAssetCallback={() => {
            /* no-op: we handle selection via setWalletCallBack */
          }}
        >
          <AccountListPanel
            walletList={wallets}
            setWalletCallBack={setWalletCallBack}
            containerType={activePanel}
            listType={listType}
          />
        </AssetSelectProvider>
      </AssetSelectDisplayProvider>
    </div>
  );
}
