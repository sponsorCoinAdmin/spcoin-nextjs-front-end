// File: components/containers/AssetSelectPanels/AssetSelectPanel.tsx
'use client';

import AddressSelect from '@/components/views/AddressSelect';
import DataListSelect from '@/components/views/DataListSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionContext';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function AssetSelectPanel() {
  const {
    instanceId,
    feedType,
  } = useAssetSelectionContext();
  debugLog.log('✅ [AssetSelectPanel] component file loaded');
  // alert('✅ [AssetSelectPanel] component file loaded');
  // 🧠 Trigger FSM validation now that we're within AssetSelectionProvider

  debugLog.log(`🆔 AssetSelectPanel using instanceId: ${instanceId}`);

  return (
    <div
      id="AssetSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
    >
      <AddressSelect />
      <DataListSelect dataFeedType={feedType} />
    </div>
  );
}
