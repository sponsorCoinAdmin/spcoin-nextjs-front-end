// File: @/components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

import AddressSelect from '@/components/views/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import { useAssetSelectContext } from '@/lib/context';
import { useFeedData } from '@/lib/utils/feeds/assetSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('FSMTraceTab', DEBUG_ENABLED, LOG_TIME);

export default function AssetListSelectPanel() {
  const { instanceId, feedType } = useAssetSelectContext();

  debugLog.log?.('[AssetListSelectPanel] context', { instanceId, feedType });

  const { feedData, loading } = useFeedData(feedType);
  const safeFeedData = feedData ?? { wallets: [], tokens: [] };

  debugLog.log?.('[AssetListSelectPanel] feedData snapshot', {
    loading,
    walletsCount: safeFeedData.wallets?.length ?? 0,
    tokensCount: safeFeedData.tokens?.length ?? 0,
  });

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
