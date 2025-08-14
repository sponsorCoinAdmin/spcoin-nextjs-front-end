// File: components/shared/AddressSelect.tsx
'use client';

import React, { useEffect, useState } from 'react';
import HexAddressInput from '@/components/shared/utils/HexAddressInput';
import RenderAssetPreview from '@/components/shared/utils/sharedPreviews/RenderAssetPreview';
import ErrorAssetPreview from '../shared/utils/sharedPreviews/ErrorAssetPreview';

import { useAssetSelectionContext } from '@/lib/context/ScrollSelectPanels/useAssetSelectionlContext';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useValidateFSMInput } from '@/lib/hooks/inputValidations/validations/useValidateFSMInput';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { InputState } from '@/lib/structure';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

debugLog.log('✅ [AddressSelect] component file loaded');

export default function AddressSelect() {
  const {
    instanceId,
    manualEntry,
    setManualEntry,
    validHexInput,
    debouncedHexInput,
    handleHexInputChange, // (value: string, manual?: boolean)
    setInputState,
  } = useAssetSelectionContext();

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');

  useEffect(() => {
    debugLog.log(`🔄 debouncedHexInput → "${debouncedHexInput}" (manualEntry=${String(manualEntry)})`);
  }, [debouncedHexInput, manualEntry]);

  const safeInput = debouncedHexInput.trim() !== '' ? debouncedHexInput : undefined;
  const { inputState, validatedToken, validatedWallet } = useValidateFSMInput(safeInput);

  debugLog.log('🧪 useValidateFSMInput returned:', { inputState, validatedToken, validatedWallet });

  // Only enforce manualEntry=true while this keystroke/paste is being processed.
  const [enforceManualTrue, setEnforceManualTrue] = useState(false);
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

  // One-tick enforcement toggle so we don’t fight programmatic selections
  const armEnforcementForThisTick = () => {
    setEnforceManualTrue(true);
    requestAnimationFrame(() => setEnforceManualTrue(false));
  };

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          debugLog.log('✏️ [HexAddressInput] onChange:', val);

          // Popups to make the flow obvious during debugging
          // alert(`✍️ Manual edit detected Enforcing manualEntry=true\nvalue=${val}`);

          // Ensure manual mode for this event, then commit
          armEnforcementForThisTick();
          setManualEntry(true);

          setInputState(InputState.FSM_READY, 'AddressSelect (Manual Entry)');
          handleHexInputChange(val, true);
        }}
        placeholder="Enter address"
        statusEmoji=""
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
