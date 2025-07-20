// File: components/shared/AddressSelect.tsx

'use client';

import styles from '@/styles/Modal.module.css';
import React, { useEffect } from 'react';
import { SP_COIN_DISPLAY } from '@/lib/structure';

import HexAddressInput from '@/components/shared/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import DataList from '../Dialogs/Resources/DataList';
import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { useActiveDisplay } from '@/lib/context/hooks';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import ErrorAssetPreview from './utils/sharedPreviews/ErrorAssetPreview';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';

// ✅ DEBUG marker: component loaded
console.log('✅ AddressSelect component file loaded');

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

export default function AddressSelect() {
  const {
    instanceId,
    validatedAsset,
    feedType,
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,
  } = useSharedPanelContext();

  const { setActiveDisplay } = useActiveDisplay();
  const MANUAL_ENTRY = true;

  // 🚨 Log context values on every render
  console.log('🆔 [AddressSelect] context instanceId:', instanceId);
  console.log('✅ AddressSelect function START');
  console.log('⚡ [AddressSelect] Re-render, validHexInput =', validHexInput);
  console.log('⚡ [AddressSelect] debouncedHexInput =', debouncedHexInput);

  // ✅ Watch debouncedHexInput in a useEffect (triggers when updated)
  useEffect(() => {
    debugLog.log(`🔄 debouncedHexInput updated → "${debouncedHexInput}"`);
  }, [debouncedHexInput]);

  // ✅ Pass debounced input to FSM (guard empty string)
  const safeInput = debouncedHexInput.trim() !== '' ? debouncedHexInput : undefined;
  console.log('💥 [AddressSelect] Passing to useValidateFSMInput →', safeInput);
  useValidateFSMInput(safeInput);

  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect() → ${item.address}`);
    try {
      const result = handleHexInputChange(item.address, true);
      debugLog.log(`🧝‍♂️ onManualSelect handleHexInputChange result → ${result}`);
    } catch (err) {
      console.error('❌ handleHexInputChange onManualSelect error:', err);
    }
  };

  const onDataListSelect = (item: ValidatedAsset) => {
    debugLog.log(`📜 onDataListSelect() → ${item.address}`);
    try {
      const result = handleHexInputChange(item.address, !MANUAL_ENTRY);
      debugLog.log(`📜 onDataListSelect handleHexInputChange result → ${result}`);
      alert(`onDataListSelect(${item.address})`);
      setActiveDisplay(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
    } catch (err) {
      console.error('❌ handleHexInputChange onDataListSelect error:', err);
    }
  };

  return (
    <div id="inputSelectDiv" className={`${styles.inputSelectWrapper} flex flex-col h-full min-h-0`}>
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          console.log('✏️ [HexAddressInput] onChange →', val);
          try {
            if (typeof handleHexInputChange === 'function') {
              const result = handleHexInputChange(val, MANUAL_ENTRY);
              console.log('⚙️ handleHexInputChange returned:', result);
            } else {
              console.warn('⚠️ handleHexInputChange is not a function!');
            }
          } catch (err) {
            console.error('❌ handleHexInputChange onChange error:', err);
          }
        }}
        placeholder="Enter address"
        statusEmoji=""
      />

      <ErrorAssetPreview />

      <RenderAssetPreview
        validatedAsset={validatedAsset}
        onSelect={onManualSelect}
      />

      <div id="inputSelectFlexDiv" className="flex flex-col flex-grow min-h-0 gap-[0.2rem]">
        <div id="DataListDiv" className={`${styles.scrollDataListPanel} ${styles.scrollDataListPanelHidden}`}>
          <DataList
            dataFeedType={feedType}
            onSelect={onDataListSelect}
          />
        </div>
      </div>
    </div>
  );
}
