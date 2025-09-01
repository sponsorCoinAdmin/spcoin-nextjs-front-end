// File: components/shared/AddressSelect.tsx
'use client';

import React, { useEffect, useState } from 'react';
import HexAddressInput from '@/components/shared/utils/HexAddressInput';
import RenderAssetPreview from '@/components/views/sharedPreviews/RenderAssetPreview';
import ErrorAssetPreview from '@/components/views/sharedPreviews/ErrorAssetPreview';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { InputState } from '@/lib/structure/assetSelection';
import { useAssetSelectContext } from '@/lib/context';

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
    handleHexInputChange,
    setInputState,
  } = useAssetSelectContext();

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');

  useEffect(() => {
    debugLog.log(
      `🔄 debouncedHexInput → "${debouncedHexInput}" (manualEntry=${String(manualEntry)})`
    );
  }, [debouncedHexInput, manualEntry]);

  const [enforceManualTrue, setEnforceManualTrue] = useState(false);
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

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
          armEnforcementForThisTick();
          setManualEntry(true);

          // Kick FSM
          setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Manual Entry)');

          // Trace the handler acceptance
          debugLog.log?.(
            `✏️ [HexAddressInput] calling handleHexInputChange("${val.slice(0, 6)}…", true)`
          );
          const accepted = handleHexInputChange(val, true);
          debugLog.log?.(`✏️ handleHexInputChange accepted=${accepted}`);
        }}
        placeholder="Enter address"
        statusEmoji=""
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
