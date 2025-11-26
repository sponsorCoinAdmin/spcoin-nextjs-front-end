// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import { useEffect } from 'react';
import AddressSelect from '@/components/views/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { FEED_TYPE } from '@/lib/structure'; // ⬅️ add this

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('FSMTraceTab', DEBUG_ENABLED, LOG_TIME);

export default function AssetListSelectPanel() {
  const { instanceId, feedType } = useAssetSelectContext();

  debugLog.log?.('[AssetListSelectPanel] context', { instanceId, feedType });

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

  debugLog.log?.('[AssetListSelectPanel] feedData snapshot', {
    loading,
    walletsCount,
    tokensCount,
  });

  // 🔍 One-time debug alert for TOKEN_LIST (TokenListSelectPanel equivalent)
  useEffect(() => {
    if (feedType !== FEED_TYPE.TOKEN_LIST) return;
    if (!feedData) return;
    if (!('tokens' in feedData) || !Array.isArray((feedData as any).tokens)) {
      return;
    }

    const tokens = (feedData as any).tokens as any[];
    const first = tokens[0];

    const firstSymbol = first?.symbol ?? 'no-symbol';
    const firstAddress = first?.address ?? 'no-address';
    const logoURL =
      typeof first?.logoURL === 'string' ? first.logoURL : 'none';

    let fullLogoURL = logoURL;
    if (
      logoURL &&
      !logoURL.startsWith('http') &&
      typeof window !== 'undefined'
    ) {
      fullLogoURL = window.location.origin + logoURL;
    }

    alert(
      [
        '[Token debug]',
        `instanceId: ${instanceId}`,
        `feedType: ${feedType}`,
        `tokens.length: ${tokens.length}`,
        `first.symbol: ${firstSymbol}`,
        `first.address: ${firstAddress}`,
        `first.logoURL: ${logoURL}`,
        `first.logoURL (full): ${fullLogoURL}`,
      ].join('\n')
    );
  }, [feedType, feedData, instanceId]);

  return (
    <div
      id="AssetListSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
      data-instance={instanceId}
      data-feed-type={feedType}
    >
      <AddressSelect />
      <DataListSelect
        feedData={safeFeedData}
        loading={loading}
        feedType={feedType}
      />
    </div>
  );
}
