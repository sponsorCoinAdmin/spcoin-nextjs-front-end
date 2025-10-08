// File: components/containers/AssetSelectPanel/AssetSelectPanel.tsx
'use client';

import AddressSelect from '@/components/views/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import { useAssetSelectContext } from '@/lib/context';

export default function AssetSelectPanel() {
  const { instanceId, feedType } = useAssetSelectContext();

  return (
    <div
      id="AssetSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
      data-instance={instanceId}
    >
      <AddressSelect />
      <DataListSelect dataFeedType={feedType} />
    </div>
  );
}
