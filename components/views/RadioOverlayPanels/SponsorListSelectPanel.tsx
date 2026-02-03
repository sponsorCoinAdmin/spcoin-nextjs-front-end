// File: @/components/views/RadioOverlayPanels/SponsorListSelectPanel.tsx
'use client';

import React, { useCallback, useEffect, useContext, useMemo } from 'react';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ✅ Provide the context AddressSelect expects (without going through the old wrapper)
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AccountListRewardsPanel from './AccountListRewardsPanel';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('SponsorListSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function SponsorListSelectPanel() {
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

  return <SponsorListSelectInner activePanel={activePanel} />;
}

function SponsorListSelectInner({
  activePanel,
}: {
  activePanel: SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;
}) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  // ✅ Directly load sponsor accounts
  const { feedData, loading, error } = useFeedData(FEED_TYPE.SPONSOR_ACCOUNTS);

  /**
   * ✅ SSOT: spCoinAccounts only
   */
  const accounts: spCoinAccount[] = useMemo(() => {
    const anyData: any = feedData;
    return Array.isArray(anyData?.spCoinAccounts)
      ? (anyData.spCoinAccounts as spCoinAccount[])
      : [];
  }, [feedData]);

  useEffect(() => {
    const anyData: any = feedData;

    debugLog.log?.('[data]', {
      activePanel: SP_COIN_DISPLAY[activePanel],
      loading,
      error: error ?? null,

      accountsLen: accounts.length,
      hasSpCoinAccounts: Array.isArray(anyData?.spCoinAccounts),

      sourceId: anyData?.__sourceId ?? '(missing __sourceId)',
      sourceKind: anyData?.__sourceKind ?? '(missing __sourceKind)',
    });
  }, [activePanel, loading, error, accounts.length, feedData]);

  const setAccountCallBack = useCallback(
    (account?: spCoinAccount) => {
      if (!account?.address) {
        debugLog.log?.('[setAccountCallBack] ignored (no account/address)', {
          account,
        });
        return;
      }

      debugLog.log?.('[setAccountCallBack]', {
        activePanel: SP_COIN_DISPLAY[activePanel],
        addressPreview: String(account.address).slice(0, 12),
        name: (account as any)?.name,
      });

      // 1) Store selected account in ExchangeContext
      ctx?.setExchangeContext(
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccount: account,
            },
          };
        },
        `SponsorListSelectPanel:setAccountCallBack(${SP_COIN_DISPLAY[activePanel]}:sponsorAccount)`,
      );

      // 2) Open sponsor detail panel
      openPanel(
        SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
        `SponsorListSelectPanel:setAccountCallBack(open SPONSOR_ACCOUNT_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
        activePanel,
      );
    },
    [activePanel, ctx, openPanel],
  );

  // Minimal render states
  if (loading) {
    return (
      <div id="SponsorListSelectLoading" className="p-3 text-sm opacity-70">
        Loading sponsor accounts…
      </div>
    );
  }

  if (error) {
    return (
      <div id="SponsorListSelectError" className="p-3 text-sm opacity-70">
        Failed to load sponsor accounts: {error}
      </div>
    );
  }

  return (
    <div
      id="SponsorListSelectPanel"
      className="h-full min-h-0 w-full flex flex-col overflow-hidden"
    >
      <AssetSelectDisplayProvider>
        <AssetSelectProvider
          containerType={activePanel}
          feedTypeOverride={FEED_TYPE.SPONSOR_ACCOUNTS}
          closePanelCallback={() => {
            /* no-op */
          }}
          setSelectedAssetCallback={() => {
            /* no-op */
          }}
        >
          <AccountListRewardsPanel
            accountList={accounts}
            setAccountCallBack={setAccountCallBack}
            containerType={activePanel}
          />
        </AssetSelectProvider>
      </AssetSelectDisplayProvider>
    </div>
  );
}
