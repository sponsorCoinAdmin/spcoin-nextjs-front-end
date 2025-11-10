// File: components/containers/AssetListSelectPanel/AssetListSelectPanel.tsx
'use client';

// import AddressSelect from '@/components/views/AddressSelect';
// import DataListSelect from '@/components/views/DataListSelect';
import { useAssetSelectContext } from '@/lib/context';
// import { useFeedData } from '@/lib/utils/feeds/assetSelect';

export default function AssetListSelectPanel() {
  const { instanceId } = useAssetSelectContext();

  // Build data + loading state via the shared hook
  // const { feedData, loading } = useFeedData(feedType);

  // Ensure DataListSelect always receives a non-null FeedData
  // const safeFeedData = feedData ?? { wallets: [], tokens: [] };

  return (
    <div
      id="AssetListSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
      data-instance={instanceId}
    >
      {/* <AddressSelect />
      <DataListSelect feedData={safeFeedData} loading={loading} feedType={feedType} /> */}
    </div>
  );
}
