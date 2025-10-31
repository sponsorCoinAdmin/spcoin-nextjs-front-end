// File: components/shared/AddressSelect.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
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

type Props = {
  defaultAddress?: string;
  /** If true, this AddressSelect instance disables the FSM runner. */
  bypassDefaultFsm?: boolean;
};

export default function AddressSelect({ defaultAddress, bypassDefaultFsm = false }: Props) {
  const {
    instanceId,
    manualEntry,
    setManualEntry,
    validHexInput,
    debouncedHexInput,
    handleHexInputChange,
    setInputState,
    setBypassFSM, // ⬅️ now provided by context
  } = useAssetSelectContext() as any;

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');

  // Reflect prop -> context
  useEffect(() => {
    if (typeof setBypassFSM === 'function') {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[AddressSelect] setBypassFSM called', { instanceId, bypassDefaultFsm });

      setBypassFSM(!!bypassDefaultFsm);
      debugLog.log(`⏭️ [${instanceId}] setBypassFSM(${String(!!bypassDefaultFsm)})`);
    } else if (bypassDefaultFsm) {
      debugLog.warn(`⏭️ [${instanceId}] bypassDefaultFsm=true but context has no setBypassFSM; will locally avoid FSM kicks.`);
    }
  }, [bypassDefaultFsm, setBypassFSM, instanceId]);

  useEffect(() => {
    // DEBUG LOG TO BE REMOVED LATER
    console.log('[AddressSelect] debouncedHexInput change', {
      instanceId,
      debouncedHexInput,
      manualEntry,
      bypassDefaultFsm
    });

    debugLog.log(
      `🔄 debouncedHexInput → "${debouncedHexInput}" (manualEntry=${String(manualEntry)}, bypass=${String(bypassDefaultFsm)})`
    );
  }, [debouncedHexInput, manualEntry, bypassDefaultFsm, instanceId]);

  const [enforceManualTrue, setEnforceManualTrue] = useState(false);
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

  const armEnforcementForThisTick = () => {
    // DEBUG LOG TO BE REMOVED LATER
    console.log('[AddressSelect] armEnforcementForThisTick()', { instanceId });
    setEnforceManualTrue(true);
    requestAnimationFrame(() => setEnforceManualTrue(false));
  };

  // Prefill from defaultAddress (no FSM kick while bypassing)
  const lastAppliedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const next = (defaultAddress ?? '').trim();
    if (!next) return;
    if (lastAppliedRef.current === next && validHexInput === next) return;

    debugLog.log?.(
      `🧩 Applying defaultAddress "${next.slice(0, 8)}…"; current validHexInput="${validHexInput}" (bypass=${String(bypassDefaultFsm)})`
    );

    // DEBUG LOG TO BE REMOVED LATER
    console.log('[AddressSelect] defaultAddress apply BEGIN', {
      instanceId,
      next,
      validHexInput,
      bypassDefaultFsm
    });

    setManualEntry(true); // mark as manual for pasted/prefilled flow

    if (!bypassDefaultFsm) {
      // DEBUG LOG TO BE REMOVED LATER
      console.log('[AddressSelect] defaultAddress → setInputState(EMPTY_INPUT)', { instanceId });

      setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Default Address)');
    } else {
      debugLog.log('⏭️ Bypass active: not kicking FSM on defaultAddress apply');
    }

    // DEBUG LOG TO BE REMOVED LATER
    console.log('[AddressSelect] defaultAddress → handleHexInputChange()', {
      instanceId,
      arg: next
    });

    handleHexInputChange(next, true);
    lastAppliedRef.current = next;

    // DEBUG LOG TO BE REMOVED LATER
    console.log('[AddressSelect] defaultAddress apply END', { instanceId });
  }, [defaultAddress, validHexInput, setManualEntry, setInputState, handleHexInputChange, bypassDefaultFsm, instanceId]);

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          // DEBUG LOG TO BE REMOVED LATER
          console.log('[AddressSelect] HexAddressInput.onChange BEGIN', {
            instanceId,
            valPreview: val?.slice(0, 10),
            bypassDefaultFsm
          });

          debugLog.log('✏️ [HexAddressInput] onChange:', val);
          armEnforcementForThisTick();

          // DEBUG LOG TO BE REMOVED LATER
          console.log('[AddressSelect] setManualEntry(true)', { instanceId });

          setManualEntry(true);

          if (!bypassDefaultFsm) {
            // DEBUG LOG TO BE REMOVED LATER
            console.log('[AddressSelect] onChange → setInputState(EMPTY_INPUT)', { instanceId });

            setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Manual Entry)');
          } else {
            debugLog.log('⏭️ Bypass active: not kicking FSM on manual entry');
          }

          // DEBUG LOG TO BE REMOVED LATER
          console.log('[AddressSelect] onChange → handleHexInputChange(val, true)', {
            instanceId
          });

          const accepted = handleHexInputChange(val, true);

          // DEBUG LOG TO BE REMOVED LATER
          console.log('[AddressSelect] handleHexInputChange result', { instanceId, accepted });

          debugLog.log?.(
            `✏️ [HexAddressInput] calling handleHexInputChange("${val.slice(0, 6)}…", true)`
          );
          debugLog.log?.(`✏️ handleHexInputChange accepted=${accepted}`);

          // DEBUG LOG TO BE REMOVED LATER
          console.log('[AddressSelect] HexAddressInput.onChange END', { instanceId });
        }}
        placeholder="Enter address"
        statusEmoji=""
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
