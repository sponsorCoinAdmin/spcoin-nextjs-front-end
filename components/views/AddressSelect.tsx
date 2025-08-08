// File: components/shared/AddressSelect.tsx
'use client';

import React, { useEffect } from 'react';
import HexAddressInput from '@/components/shared/utils/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ErrorAssetPreview from '../shared/utils/sharedPreviews/ErrorAssetPreview';

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
import { InputState } from '@/lib/structure'; // ✅ import InputState enum

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

debugLog.log('✅ [AddressSelect] component file loaded');
// NOTE: this alert will not compile in production mode, not sure why.
// alert('✅ [AddressSelect] component file loaded');

export default function AddressSelect() {
  const {
    instanceId,
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,
    setManualEntry,
    setInputState, // ✅ added from context
  } = useSharedPanelContext();

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');
  debugLog.log('⚡ validHexInput =', validHexInput);
  debugLog.log('⚡ debouncedHexInput =', debouncedHexInput);

  useEffect(() => {
    debugLog.log(`🔄 debouncedHexInput updated → "${debouncedHexInput}"`);
  }, [debouncedHexInput]);

  const safeInput = debouncedHexInput.trim() !== '' ? debouncedHexInput : undefined;

  const {
    inputState,
    validatedToken,
    validatedWallet,
  } = useValidateFSMInput(safeInput);

  debugLog.log('🧪 useValidateFSMInput returned:', {
    inputState,
    validatedToken,
    validatedWallet,
  });

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          debugLog.log('✏️ [HexAddressInput] onChange triggered with:', val);
          try {
            setManualEntry(true); // ✅ Mark this as user-typed
            setInputState(InputState.FSM_READY, "AddressSelect (Manual Entry)"); // ✅ Mark FSM as ready
            const result = handleHexInputChange(val);
            debugLog.log('⚙️ handleHexInputChange returned:', result);
          } catch (err) {
            debugLog.error('❌ handleHexInputChange threw error:', err);
          }
        }}
        placeholder="Enter address"
        statusEmoji=""
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
