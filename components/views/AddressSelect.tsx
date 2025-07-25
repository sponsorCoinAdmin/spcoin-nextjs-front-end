// File: components/shared/AddressSelect.tsx

'use client';

import React, { useEffect } from 'react';
import HexAddressInput from '@/components/shared/utils/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ErrorAssetPreview from '../shared/utils/sharedPreviews/ErrorAssetPreview';

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

debugLog.log('✅ [AddressSelect] component file loaded');

export default function AddressSelect() {
  const {
    instanceId,
    validatedAsset,
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,
  } = useSharedPanelContext();

  const MANUAL_ENTRY = true;

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');
  debugLog.log('⚡ Re-render, validHexInput =', validHexInput);
  debugLog.log('⚡ debouncedHexInput =', debouncedHexInput);

  useEffect(() => {
    debugLog.log(`🔄 debouncedHexInput updated → "${debouncedHexInput}"`);
  }, [debouncedHexInput]);

  const safeInput = debouncedHexInput.trim() !== '' ? debouncedHexInput : undefined;

  const {
    inputState,
    validatedAsset: fsmValidatedAsset,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  } = useValidateFSMInput(safeInput);

  debugLog.log('🧪 useValidateFSMInput result:', {
    inputState,
    validatedAsset: fsmValidatedAsset,
  });

  const onManualSelect = (item: ValidatedAsset) => {
    debugLog.log(`🧝‍♂️ onManualSelect() → ${item.address}`);
    try {
      const result = handleHexInputChange(item.address, true);
      debugLog.log(`🧝‍♂️ onManualSelect handleHexInputChange result → ${result}`);
    } catch (err) {
      debugLog.error('❌ handleHexInputChange onManualSelect error:', err);
    }
  };

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          debugLog.log('✏️ [HexAddressInput] onChange →', val);
          try {
            if (typeof handleHexInputChange === 'function') {
              const result = handleHexInputChange(val, MANUAL_ENTRY);
              debugLog.log('⚙️ handleHexInputChange returned:', result);
            } else {
              debugLog.warn('⚠️ handleHexInputChange is not a function!');
            }
          } catch (err) {
            debugLog.error('❌ handleHexInputChange onChange error:', err);
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
    </div>
  );
}
