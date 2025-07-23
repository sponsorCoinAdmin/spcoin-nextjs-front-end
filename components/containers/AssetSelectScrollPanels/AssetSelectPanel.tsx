// File: components/containers/AssetSelectPanels/AssetSelectPanel.tsx

'use client';

import { useEffect } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import DataListScrollPanel from '@/components/Dialogs/Resources/DataListScrollPanel';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
import { InputState } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function AssetSelectPanel() {
  const {
    containerType,
    validHexInput,
    instanceId,
    feedType,
    handleHexInputChange,
    closeCallback,
  } = useSharedPanelContext();

  const safeInput = validHexInput.trim() !== '' ? validHexInput : undefined;

  debugLog.log(`🆔 AssetSelectPanel using instanceId: ${instanceId}`);
  useValidateFSMInput(safeInput);

  useEffect(() => {
    debugLog.log(`📥 AssetSelectPanel mounted (containerType=${containerType})`);
  }, [containerType]);

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect() → ${item.address}`);
    try {
      handleHexInputChange(item.address, false);
    } catch (err) {
      console.error('❌ handleHexInputChange onDataListSelect error:', err);
    }
  };

  return (
    <div
      id="AssetSelectPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
    >
      <AddressSelect />
      <DataListScrollPanel dataFeedType={feedType} onSelect={onDataListSelect} />
    </div>
  );
}
