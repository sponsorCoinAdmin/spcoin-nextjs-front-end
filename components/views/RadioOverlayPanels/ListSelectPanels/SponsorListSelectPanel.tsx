// File: @/components/views/RadioOverlayPanels/SponsorListSelectPanel.tsx
'use client';

import React, { useCallback, useEffect, useContext, useMemo } from 'react';
import { isAddress } from '@/lib/utils/address';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount, type TokenContract } from '@/lib/structure';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { useSelectionCommit } from '@/lib/context/hooks/ExchangeContext/selectionCommit/useSelectionCommit';

import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import PanelListSelectWrapper from '../../AssetSelectPanels/PanelListSelectWrapper';

// ✅ Provide the context AddressSelect expects (without going through the old wrapper)
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import AccountListRewardsPanel from '../AccountListRewardsPanel';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_MANAGE_SPONSORS === 'true';

const debugLog = createDebugLogger('SponsorListSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function SponsorListSelectPanel() {
  const vRewards = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);
  const vAccountList = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_SELECT_PANEL);
  const vSponsorListRaw = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_LIST);
  const vSponsorList = vAccountList && vSponsorListRaw;

  useEffect(() => {
    debugLog.log?.('[visibility]', {
      vSponsorList,
      vRewards,
      activePanel: vSponsorList
        ? SP_COIN_DISPLAY[SP_COIN_DISPLAY.SPONSOR_LIST]
        : vRewards
        ? SP_COIN_DISPLAY[SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL]
        : null,
    });
  }, [vSponsorList, vRewards]);

  if (vSponsorList) return <SponsorListSelectPanelInner />;
  if (!vRewards) return null;

  return <SponsorListRewardsPanelInner />;
}

function hasValidAddress(a: any): a is { address: string } {
  return typeof a?.address === 'string' && isAddress(a.address);
}

function SponsorListSelectPanelInner() {
  const { commitSponsor } = useSelectionCommit();

  const handleCommit = (asset: spCoinAccount | TokenContract) => {
    if (!hasValidAddress(asset)) return;
    commitSponsor(asset as spCoinAccount);
  };

  return (
    <div id="SPONSOR_LIST" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div id="ACCOUNT_LIST_SELECT_PANEL" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <PanelListSelectWrapper
          onCommit={handleCommit}
          containerTypeOverride={SP_COIN_DISPLAY.SPONSOR_LIST}
        />
      </div>
    </div>
  );
}

function SponsorListRewardsPanelInner() {
  const ctx = useContext(ExchangeContextState);
  const activePanel = SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;

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

      // ✅ Store selected account in ExchangeContext (no detail-panel open here)
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
    },
    [activePanel, ctx],
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
      id="ACCOUNT_LIST_REWARDS_PANEL"
      className="h-full min-h-0 w-full flex flex-col overflow-hidden"
    >
      <div id="ACCOUNT_LIST_SELECT_PANEL" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
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
    </div>
  );
}
