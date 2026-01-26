// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import React, { useEffect, useMemo } from 'react';

import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import AccountListRewardsPanel from '@/components/views/RadioOverlayPanels/AccountListRewardsPanel';

import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { FEED_TYPE, SP_COIN_DISPLAY, LIST_TYPE, type spCoinAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

// ✅ SSOT: same FeedData type used by DataListSelect
import type { FeedData } from '@/lib/utils/feeds/assetSelect/types';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

type Props = {
  /** Mandatory (temporary): forces callers to decide what UI/actions this list should render */
  listType: LIST_TYPE;
};

function isTokenFeedType(feedType: FEED_TYPE) {
  return feedType === FEED_TYPE.TOKEN_LIST;
}

function isAccountFeedType(feedType: FEED_TYPE) {
  return (
    feedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
    feedType === FEED_TYPE.AGENT_ACCOUNTS ||
    feedType === FEED_TYPE.SPONSOR_ACCOUNTS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS
  );
}

/** ✅ Prefer SSOT accountsXXXX, fallback to legacy wallets while migrating */
function getAccountsFromFeed(feedData: any): spCoinAccount[] {
  if (Array.isArray(feedData?.accountsXXXX)) return feedData.accountsXXXX as spCoinAccount[];
  if (Array.isArray(feedData?.wallets)) return feedData.wallets as spCoinAccount[];
  return [];
}

export default function AssetListSelectPanel({ listType }: Props) {
  const assetCtx = useAssetSelectContext() as any;

  const {
    instanceId,
    feedType,
    handleHexInputChange,
    setManualEntry,
    setInputState,
    manualEntry,
    setTradingTokenCallback,
  } = assetCtx;

  const containerType: SP_COIN_DISPLAY | undefined = assetCtx.containerType;
  const containerLabel = containerType != null ? SP_COIN_DISPLAY[containerType] : 'UNKNOWN';

  debugLog.log?.('[context]', {
    instanceId,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    listType,
    listTypeLabel: LIST_TYPE[listType],
    containerType,
    containerLabel,
  });

  const { feedData, loading } = useFeedData(feedType);

  /**
   * ✅ Always return a valid SSOT FeedData shape
   * - Token feeds: { feedType: TOKEN_LIST, tokens: [] }
   * - Account feeds: { feedType: <account feed>, accountsXXXX: [] }
   *
   * NOTE: we do NOT invent `wallets` here; legacy is only a fallback reader.
   */
  const safeFeedData: FeedData = useMemo(() => {
    if (feedData) return feedData;

    if (isTokenFeedType(feedType)) {
      return { feedType: FEED_TYPE.TOKEN_LIST, tokens: [] };
    }

    // account feeds
    return { feedType: feedType as any, accountsXXXX: [] };
  }, [feedData, feedType]);

  // Logging counts (accountsXXXX first, wallets fallback)
  const accounts = useMemo(() => getAccountsFromFeed(safeFeedData as any), [safeFeedData]);

  const accountsCount = accounts.length;
  const tokensCount =
    safeFeedData && Array.isArray((safeFeedData as any).tokens) ? (safeFeedData as any).tokens.length : 0;

  debugLog.log?.('[feedData snapshot]', {
    loading,
    accountsCount,
    tokensCount,
    hasAccountsXXXX: Array.isArray((safeFeedData as any)?.accountsXXXX),
    legacyWalletsLen: Array.isArray((safeFeedData as any)?.wallets) ? (safeFeedData as any).wallets.length : 0,
  });

  // ✅ Manage view is driven by listType (NOT feedType)
  const isManageView =
    listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS || listType === LIST_TYPE.SPONSOR_UNSPONSOR;

  const showAddressBar = !isManageView;

  useEffect(() => {
    debugLog.log?.('[render]', {
      instanceId,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: LIST_TYPE[listType],
      isManageView,
      showAddressBar,
      containerType,
      containerLabel,
      isAccountFeed: isAccountFeedType(feedType),
    });
  }, [instanceId, feedType, listType, isManageView, showAddressBar, containerType, containerLabel]);

  // When an account is picked in AccountListRewardsPanel, push it through the same FSM bridge.
  const setWalletCallBack = (account?: spCoinAccount) => {
    if (!account?.address) {
      debugLog.log?.('[setWalletCallBack] called with no account/address', { account });
      return;
    }

    debugLog.log?.('[setWalletCallBack]', {
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: LIST_TYPE[listType],
      manualEntry,
      addressPreview: account.address.slice(0, 10),
    });

    setManualEntry(false);
    setInputState(InputState.EMPTY_INPUT, 'AssetListSelectPanel (AccountListRewardsPanel)');
    handleHexInputChange(account.address, false);

    setTradingTokenCallback(account);
  };

  return (
    <div
      id="AssetListSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
      data-instance={instanceId}
      data-feed-type={feedType}
      data-list-type={listType}
    >
      {showAddressBar && <AddressSelect callingParent="AssetListSelectPanel" />}

      {isManageView ? (
        <AccountListRewardsPanel
          walletList={accounts} // component API still expects walletList
          setWalletCallBack={setWalletCallBack}
          containerType={containerType as SP_COIN_DISPLAY}
          listType={listType}
        />
      ) : (
        <DataListSelect feedData={safeFeedData} loading={loading} feedType={feedType} />
      )}
    </div>
  );
}
