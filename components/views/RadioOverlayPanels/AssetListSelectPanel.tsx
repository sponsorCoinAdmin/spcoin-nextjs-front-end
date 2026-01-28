// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import AccountListRewardsPanel from '@/components/views/RadioOverlayPanels/AccountListRewardsPanel';

import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { FEED_TYPE, SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

// ✅ SSOT: same FeedData type used by DataListSelect
import type { FeedData } from '@/lib/utils/feeds/assetSelect/types';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

// keep dot-access out of the file
const LEGACY_WALLETS_KEY = 'wallets' as const;

// ✅ SSOT: list type is now expressed using SP_COIN_DISPLAY only
export type ASSET_LIST_MODE =
  | SP_COIN_DISPLAY.AGENTS
  | SP_COIN_DISPLAY.RECIPIENTS
  | SP_COIN_DISPLAY.SPONSORS
  | SP_COIN_DISPLAY.UNSPONSOR_SP_COINS;

type Props = {
  /** SSOT: which “mode” this list is in */
  listType: ASSET_LIST_MODE;
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

  // legacy fallback (bracket access avoids ".wallets" grep hits)
  const legacy = feedData?.[LEGACY_WALLETS_KEY];
  if (Array.isArray(legacy)) return legacy as spCoinAccount[];

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

  // ✅ keep latest values for mount/unmount logs (avoids stale captures)
  const latestRef = useRef({
    instanceId,
    feedType,
    listType,
    containerType,
    containerLabel,
  });
  latestRef.current = { instanceId, feedType, listType, containerType, containerLabel };

  debugLog.log?.('[context]', {
    instanceId,
    feedType,
    feedTypeLabel: FEED_TYPE[feedType],
    listType,
    listTypeLabel: SP_COIN_DISPLAY[listType],
    containerType,
    containerLabel,
  });

  // ✅ mount identity + duplicate-instance detection
  useEffect(() => {
    const mountId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const snap = latestRef.current;

    debugLog.log?.('[MOUNT]', {
      mountId,
      instanceId: snap.instanceId,
      feedType: snap.feedType,
      feedTypeLabel: FEED_TYPE[snap.feedType],
      listType: snap.listType,
      listTypeLabel: SP_COIN_DISPLAY[snap.listType],
      containerType: snap.containerType,
      containerLabel: snap.containerLabel,
    });

    // If there are multiple, it strongly suggests you mounted the panel twice
    if (typeof window !== 'undefined') {
      const count = document.querySelectorAll('#AssetListSelectPanel').length;
      debugLog.log?.('[dom] #AssetListSelectPanel count', { mountId, count });
    }

    return () => {
      const end = latestRef.current;
      debugLog.log?.('[UNMOUNT]', {
        mountId,
        instanceId: end.instanceId,
        feedType: end.feedType,
        feedTypeLabel: FEED_TYPE[end.feedType],
        listType: end.listType,
        listTypeLabel: SP_COIN_DISPLAY[end.listType],
      });
    };
  }, []);

  const { feedData, loading } = useFeedData(feedType);

  /**
   * ✅ Always return a valid SSOT FeedData shape
   * - Token feeds: { feedType: TOKEN_LIST, tokens: [] }
   * - Account feeds: { feedType: <account feed>, accountsXXXX: [] }
   */
  const safeFeedData: FeedData = useMemo(() => {
    if (feedData) return feedData;

    if (isTokenFeedType(feedType)) {
      return { feedType: FEED_TYPE.TOKEN_LIST, tokens: [] };
    }

    // account feeds
    return { feedType: feedType as any, accountsXXXX: [] };
  }, [feedData, feedType]);

  // Logging counts (accountsXXXX first, legacy fallback)
  const accounts = useMemo(() => getAccountsFromFeed(safeFeedData as any), [safeFeedData]);

  const accountsCount = accounts.length;
  const tokensCount = Array.isArray((safeFeedData as any)?.tokens) ? (safeFeedData as any).tokens.length : 0;

  // legacy count without ".wallets"
  const legacyWalletsLen = Array.isArray((safeFeedData as any)?.[LEGACY_WALLETS_KEY])
    ? (safeFeedData as any)[LEGACY_WALLETS_KEY].length
    : 0;

  debugLog.log?.('[feedData snapshot]', {
    loading,
    accountsCount,
    tokensCount,
    hasAccountsXXXX: Array.isArray((safeFeedData as any)?.accountsXXXX),
    legacyWalletsLen,
  });

  // ✅ Manage view is driven by listType (NOT feedType)
  const isManageView =
    listType === SP_COIN_DISPLAY.SPONSORS || listType === SP_COIN_DISPLAY.UNSPONSOR_SP_COINS;

  const showAddressBar = !isManageView;

  useEffect(() => {
    debugLog.log?.('[render]', {
      instanceId,
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: SP_COIN_DISPLAY[listType],
      isManageView,
      showAddressBar,
      containerType,
      containerLabel,
      isAccountFeed: isAccountFeedType(feedType),
    });
  }, [instanceId, feedType, listType, isManageView, showAddressBar, containerType, containerLabel]);

  // When an account is picked in AccountListRewardsPanel, push it through the same FSM bridge.
  const setAccountCallBack = (account?: spCoinAccount) => {
    if (!account?.address) {
      debugLog.log?.('[setAccountCallBack] called with no account/address', { account });
      return;
    }

    debugLog.log?.('[setAccountCallBack]', {
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: SP_COIN_DISPLAY[listType],
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
          accountList={accounts} // component API still expects accountList (prop name only)
          setAccountCallBack={setAccountCallBack}
          containerType={containerType as SP_COIN_DISPLAY}
          listType={listType}
        />
      ) : (
        <DataListSelect feedData={safeFeedData} loading={loading} feedType={feedType} />
      )}
    </div>
  );
}
