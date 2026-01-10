

// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import React, { useEffect } from 'react';

import AddressSelect from '@/components/views/AssetSelectPanels/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import ManageWalletList from '@/components/views/ManageSponsorships/ManageWalletList';

import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  LIST_TYPE,
  type WalletAccount,
} from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

type Props = {
  /** Mandatory (temporary): forces callers to decide what UI/actions this list should render */
  listType: LIST_TYPE;
};

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

  // containerType might not be in the TS type, so we grab it via `as any`
  const containerType: SP_COIN_DISPLAY | undefined = assetCtx.containerType;

  const containerLabel =
    containerType != null ? SP_COIN_DISPLAY[containerType] : 'UNKNOWN';

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
  const safeFeedData = feedData ?? { wallets: [], tokens: [] };

  // Narrow the union for logging
  const walletsCount =
    feedData && 'wallets' in feedData && Array.isArray(feedData.wallets)
      ? feedData.wallets.length
      : 0;

  const tokensCount =
    feedData && 'tokens' in feedData && Array.isArray(feedData.tokens)
      ? feedData.tokens.length
      : 0;

  debugLog.log?.('[feedData snapshot]', {
    loading,
    walletsCount,
    tokensCount,
  });

  // ✅ Manage view is now driven by listType (NOT feedType)
  // This allows a single feed (e.g. SPONSOR_ACCOUNTS) to have multiple list behaviors.
  const isManageView =
    listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS ||
    listType === LIST_TYPE.SPONSOR_UNSPONSOR;

  // Branch: only non-manage feeds get the AddressSelect header
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
    });
  }, [instanceId, feedType, listType, isManageView, showAddressBar, containerType, containerLabel]);

  // Wallets are the input for ManageWalletList
  const wallets: WalletAccount[] = (safeFeedData as any).wallets ?? [];

  // When a wallet is picked in ManageWalletList, push it through
  // the same FSM bridge that DataListSelect uses for account feeds.
  const setWalletCallBack = (wallet?: WalletAccount) => {
    if (!wallet?.address) {
      debugLog.log?.('[setWalletCallBack] called with no wallet/address', {
        wallet,
      });
      return;
    }

    debugLog.log?.('[setWalletCallBack]', {
      feedType,
      feedTypeLabel: FEED_TYPE[feedType],
      listType,
      listTypeLabel: LIST_TYPE[listType],
      manualEntry,
      addressPreview: wallet.address.slice(0, 10),
    });

    // Programmatic commit: mirror DataListSelect account behavior
    setManualEntry(false);
    setInputState(InputState.EMPTY_INPUT, 'AssetListSelectPanel (ManageWalletList)');
    handleHexInputChange(wallet.address, false);

    setTradingTokenCallback(wallet);
  };

  return (
    <div
      id="AssetListSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
      data-instance={instanceId}
      data-feed-type={feedType}
      data-list-type={listType}
    >
      {/* Header: only for non-manage feeds */}
      {showAddressBar && <AddressSelect callingParent="AssetListSelectPanel" />}

      {/* Body: either generic DataListSelect or the richer ManageWalletList */}
      {isManageView ? (
        <ManageWalletList
          walletList={wallets}
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
