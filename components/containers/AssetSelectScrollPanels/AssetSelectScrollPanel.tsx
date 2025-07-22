// File: components/containers/AssetSelectScrollPanels/AssetSelectScrollPanel.tsx

'use client';

import { useEffect } from 'react';
import AddressSelect from '@/components/shared/AddressSelect';
import DataList from '@/components/Dialogs/Resources/DataList';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useActiveDisplay } from '@/lib/context/hooks';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true';
const debugLog = createDebugLogger('AssetSelectScrollPanel', DEBUG_ENABLED, LOG_TIME);

interface Props {
}

export default function AssetSelectScrollPanel() {
  const {
    containerType,
    validHexInput,
    instanceId,
    feedType,
    handleHexInputChange,
  } = useSharedPanelContext();

  const { setActiveDisplay } = useActiveDisplay();
  const safeInput = validHexInput.trim() !== '' ? validHexInput : undefined;

  debugLog.log(`🆔 AssetSelectScrollPanel using instanceId: ${instanceId}`);
  useValidateFSMInput(safeInput);

  useEffect(() => {
    debugLog.log(`📥 AssetSelectScrollPanel mounted (containerType=${containerType})`);
  }, [containerType]);

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect() → ${item.address}`);
    try {
      handleHexInputChange(item.address, false);
      setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    } catch (err) {
      console.error('❌ handleHexInputChange onDataListSelect error:', err);
    }
  };

  return (
    <div
      id="AssetSelectScrollPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden"
    >
      <div className="flex flex-col h-full w-full min-h-0 gap-[4px]">
        <AddressSelect />
        <div className="flex flex-col flex-1 min-h-0">
          <DataList dataFeedType={feedType} onSelect={onDataListSelect} />
        </div>
      </div>
    </div>
  );
}
