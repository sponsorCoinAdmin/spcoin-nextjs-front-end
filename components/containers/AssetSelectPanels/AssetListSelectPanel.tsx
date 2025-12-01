// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import React, { useEffect } from 'react';

import AddressSelect from '@/components/views/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import ManageWalletList from '@/components/views/ManageSponsorships/ManageWalletList';

import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import {
  FEED_TYPE,
  SP_COIN_DISPLAY,
  type WalletAccount,
} from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger(
  'AssetListSelectPanel',
  DEBUG_ENABLED,
  LOG_TIME
);

export default function AssetListSelectPanel() {
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

  // ⚙️ Manage view is driven purely by feedType
  const isManageView =
    feedType === FEED_TYPE.MANAGE_SPONSORS ||
    feedType === FEED_TYPE.MANAGE_RECIPIENTS ||
    feedType === FEED_TYPE.MANAGE_AGENTS;

  // Branch: only non-manage feeds get the AddressSelect header
  const showAddressBar = !isManageView;

  // 🔔 Debug log to show feedType whenever this component renders
  useEffect(() => {
    const msg: string =
      `[AssetListSelectPanel] render\n` +
      `instanceId=${instanceId}\n` +
      `feedType=${feedType} (${FEED_TYPE[feedType]})\n` +
      `isManageView=${isManageView}\n` +
      `showAddressBar=${showAddressBar}`;
    debugLog.log?.(msg);
  }, [instanceId, feedType, isManageView, showAddressBar]);

  debugLog.log?.('[view mode]', {
    isManageView,
    showAddressBar,
    containerType,
    containerLabel,
  });

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
      manualEntry,
      addressPreview: wallet.address.slice(0, 10),
    });

    // Programmatic commit: mirror DataListSelect account behavior
    setManualEntry(false);
    setInputState(
      InputState.EMPTY_INPUT,
      'AssetListSelectPanel (ManageWalletList)'
    );
    handleHexInputChange(wallet.address, false);

    setTradingTokenCallback(wallet);
  };

  return (
    <div
      id="AssetListSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
      data-instance={instanceId}
      data-feed-type={feedType}
    >
      {/* Header: only for non-manage feeds */}
      {showAddressBar && (
        <AddressSelect
          callingParent="AssetListSelectPanel"
        // for trading/list-select flows we keep the original behavior
        // (no auto-useActiveAddr)
        />
      )}

      {/* Body: either generic DataListSelect or the richer ManageWalletList */}
      {isManageView ? (
        <ManageWalletList
          walletList={wallets}
          setWalletCallBack={setWalletCallBack}
          containerType={containerType as SP_COIN_DISPLAY} />
      ) : (
        <DataListSelect
          feedData={safeFeedData}
          loading={loading}
          feedType={feedType}
        />
      )}
    </div>
  );
}
