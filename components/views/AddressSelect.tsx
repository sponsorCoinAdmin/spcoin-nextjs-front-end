// File: components/shared/AddressSelect.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import HexAddressInput from '@/components/shared/utils/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ErrorAssetPreview from '../shared/utils/sharedPreviews/ErrorAssetPreview';

import { useSharedPanelContext } from '@/lib/context/ScrollSelectPanels/useSharedPanelContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
// 👇 use the conditional helper so we only enforce when editing
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { InputState } from '@/lib/structure';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

debugLog.log('✅ [AddressSelect] component file loaded');

export default function AddressSelect() {
  const {
    instanceId,
    manualEntry,            // read current mode from context
    setManualEntry,         // setter (provider updates a ref + state)
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,   // (value: string, manual?: boolean) if supported; we’ll call with just value
    setInputState,
  } = useSharedPanelContext();

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');
  debugLog.log('⚡ validHexInput =', validHexInput);
  debugLog.log('⚡ debouncedHexInput =', debouncedHexInput);

  useEffect(() => {
    debugLog.log(`🔄 debouncedHexInput updated → "${debouncedHexInput}" (manualEntry=${String(manualEntry)})`);
  }, [debouncedHexInput, manualEntry]);

  const safeInput = debouncedHexInput.trim() !== '' ? debouncedHexInput : undefined;
  const { inputState, validatedToken, validatedWallet } = useValidateFSMInput(safeInput);

  debugLog.log('🧪 useValidateFSMInput returned:', {
    inputState,
    validatedToken,
    validatedWallet,
  });

  // Only enforce manualEntry=true while a keystroke/paste is being processed
  const [enforceManualTrue, setEnforceManualTrue] = useState(false);

  // This will set manualEntry to true if it's not already, but ONLY while `enforceManualTrue` is true.
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

  // A tiny helper to briefly enable enforcement for this tick only
  const armEnforcementForThisTick = () => {
    setEnforceManualTrue(true);
    // turn it off on the next frame so we don't fight other panels (e.g., datalist)
    requestAnimationFrame(() => setEnforceManualTrue(false));
  };

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          debugLog.log('✏️ [HexAddressInput] onChange triggered with:', val);

          // Make sure manual mode is true for this edit, without blocking the input update
          armEnforcementForThisTick();
          setManualEntry(true); // provider should also update a ref synchronously

          setInputState(InputState.FSM_READY, 'AddressSelect (Manual Entry)');
          const result = handleHexInputChange(val); // pass boolean only if your handler supports it
          debugLog.log('⚙️ handleHexInputChange returned:', result);
        }}
        placeholder="Enter address"
        statusEmoji=""
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
