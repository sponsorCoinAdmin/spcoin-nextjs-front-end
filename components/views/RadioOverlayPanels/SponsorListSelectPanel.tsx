// File: @/components/views/RadioOverlayPanels/SponsorListSelectPanel.tsx
'use client';

import React, { useCallback, useEffect, useContext, useMemo } from 'react';

import { FEED_TYPE, SP_COIN_DISPLAY, LIST_TYPE, type spCoinAccount } from '@/lib/structure';

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

const debugLog = createDebugLogger('ManageSponsorRecipients', DEBUG_ENABLED, LOG_TIME);

export default function ManageSponsorRecipients() {
  const vClaim = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL);
  const vSponsorDetail = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL);

  const activePanel: SP_COIN_DISPLAY | null = vClaim ? SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL : null;

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

function ManageSponsorRecipientsInner({ activePanel }: { activePanel: SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL }) {
  const ctx = useContext(ExchangeContextState);
  const { openPanel } = usePanelTree();

  // ✅ UNSTAKING removed: listType is always claim rewards for this component
  const listType = LIST_TYPE.SPONSOR_CLAIM_REWARDS;

  // ✅ Directly load sponsor accounts
  const { feedData, loading, error } = useFeedData(FEED_TYPE.SPONSOR_ACCOUNTS);

  /**
   * ✅ SSOT: accountsXXXX only
   * If this is empty, upstream isn't producing accounts yet (which is what we want to discover).
   */
  const accounts: spCoinAccount[] = useMemo(() => {
    const anyData: any = feedData;
    return Array.isArray(anyData?.accountsXXXX) ? (anyData.accountsXXXX as spCoinAccount[]) : [];
  }, [feedData]);

  useEffect(() => {
    const anyData: any = feedData;

    debugLog.log?.('[data]', {
      activePanel: SP_COIN_DISPLAY[activePanel],
      listType: LIST_TYPE[listType],
      loading,
      error: error ?? null,

      accountsLen: accounts.length,
      hasAccountsXXXX: Array.isArray(anyData?.accountsXXXX),

      sourceId: anyData?.__sourceId ?? '(missing __sourceId)',
      sourceKind: anyData?.__sourceKind ?? '(missing __sourceKind)',
    });
  }, [activePanel, listType, loading, error, accounts.length, feedData]);

  const setAccountCallBack = useCallback(
    (account?: spCoinAccount) => {
      if (!account?.address) {
        debugLog.log?.('[setAccountCallBack] ignored (no account/address)', { account });
        return;
      }

      debugLog.log?.('[setAccountCallBack]', {
        activePanel: SP_COIN_DISPLAY[activePanel],
        listType: LIST_TYPE[listType],
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
        `ManageSponsorRecipients:setAccountCallBack(${SP_COIN_DISPLAY[activePanel]}:sponsorAccount)`,
      );

      // 2) Open sponsor detail panel
      openPanel(
        SP_COIN_DISPLAY.SPONSOR_ACCOUNT_PANEL,
        `ManageSponsorRecipients:setAccountCallBack(open SPONSOR_ACCOUNT_PANEL from ${SP_COIN_DISPLAY[activePanel]})`,
        activePanel,
      );
    },
    [activePanel, ctx, listType, openPanel],
  );

  // Minimal render states
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
   * Wrap AccountListRewardsPanel so AddressSelect has AssetSelectContext.
   */
  return (
    <div id="ManageSponsorRecipients">
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
            accountList={accounts} // component API still expects accountList
            setAccountCallBack={setAccountCallBack}
            containerType={activePanel}
            listType={listType}
          />
        </AssetSelectProvider>
      </AssetSelectDisplayProvider>
    </div>
  );
}
