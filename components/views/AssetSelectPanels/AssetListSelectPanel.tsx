// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import AccountListRewardsPanel from '@/components/views/RadioOverlayPanels/AccountListRewardsPanel';

import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { FEED_TYPE, type FeedData, type spCoinAccount, type SP_COIN_DISPLAY } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

// ✅ global util
import { deriveFeedTypeFromDisplay } from '@/lib/utils/feeds/deriveFeedTypeFromDisplay';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

// keep dot-access out of the file
const LEGACY_WALLETS_KEY = 'wallets' as const;

function isTokenFeedType(feedType: FEED_TYPE) {
  return feedType === FEED_TYPE.TOKEN_LIST;
}

function isManageFeedType(feedType: FEED_TYPE) {
  return feedType === FEED_TYPE.MANAGE_RECIPIENTS || feedType === FEED_TYPE.MANAGE_AGENTS;
}

/** Prefer SSOT spCoinAccounts, fallback to legacy wallets while migrating */
function getAccountsFromFeed(feedData: any): spCoinAccount[] {
  if (Array.isArray(feedData?.spCoinAccounts)) return feedData.spCoinAccounts as spCoinAccount[];

  // legacy fallback (bracket access avoids ".wallets" grep hits)
  const legacy = feedData?.[LEGACY_WALLETS_KEY];
  if (Array.isArray(legacy)) return legacy as spCoinAccount[];

  return [];
}

export default function AssetListSelectPanel() {
  const assetCtx = useAssetSelectContext() as any;

  const {
    instanceId,
    // feedType may not be present anymore (since we removed feedTypeOverride plumbing)
    feedType: ctxFeedType,
    handleHexInputChange,
    setManualEntry,
    setInputState,
    setTradingTokenCallback,
    containerType,
  } = assetCtx;

  // ✅ Derive feedType from containerType if not provided by context
  const feedType: FEED_TYPE | undefined = useMemo(() => {
    if (typeof ctxFeedType === 'number') return ctxFeedType as FEED_TYPE;
    if (typeof containerType === 'number') return deriveFeedTypeFromDisplay(containerType as SP_COIN_DISPLAY);
    return undefined;
  }, [ctxFeedType, containerType]);

  // If we can't determine feedType, fail safe (avoid calling hooks with undefined)
  if (feedType == null) {
    debugLog.log?.('[error] Unable to determine feedType', {
      instanceId,
      ctxFeedType,
      containerType,
    });
    return null;
  }

  const isManageView = isManageFeedType(feedType);
  const showAddressBar = !isManageView;

  // mount logs without stale captures
  const latestRef = useRef({ instanceId, feedType, isManageView, showAddressBar });
  latestRef.current = { instanceId, feedType, isManageView, showAddressBar };

  useEffect(() => {
    const mountId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const snap = latestRef.current;

    debugLog.log?.('[MOUNT]', {
      mountId,
      instanceId: snap.instanceId,
      feedType: snap.feedType,
      feedTypeLabel: FEED_TYPE[snap.feedType],
      isManageView: snap.isManageView,
      showAddressBar: snap.showAddressBar,
      containerType,
    });

    return () => {
      const end = latestRef.current;
      debugLog.log?.('[UNMOUNT]', {
        mountId,
        instanceId: end.instanceId,
        feedType: end.feedType,
        feedTypeLabel: FEED_TYPE[end.feedType],
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { feedData, loading } = useFeedData(feedType);

  // Always return a valid FeedData shape
  const safeFeedData: FeedData = useMemo(() => {
    if (feedData) return feedData;

    if (isTokenFeedType(feedType)) {
      return { feedType: FEED_TYPE.TOKEN_LIST, tokens: [] };
    }

    return { feedType: feedType as any, spCoinAccounts: [] };
  }, [feedData, feedType]);

  const accounts = useMemo(() => getAccountsFromFeed(safeFeedData as any), [safeFeedData]);

  const setAccountCallBack = (account?: spCoinAccount) => {
    if (!account?.address) return;

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
    >
      {showAddressBar && <AddressSelect callingParent="AssetListSelectPanel" />}

      {isManageView ? (
        <AccountListRewardsPanel
          accountList={accounts}
          setAccountCallBack={setAccountCallBack}
          containerType={containerType}
        />
      ) : (
        <DataListSelect feedData={safeFeedData} loading={loading} feedType={feedType} />
      )}
    </div>
  );
}
