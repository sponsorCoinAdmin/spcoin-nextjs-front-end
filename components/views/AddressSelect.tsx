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

debugLog.log('✅ [AddressSelect] component file loaded');

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
//  - bypassDefaultFsm: if true, AddressSelect will NOT "kick" the FSM and will
//    attempt to notify the upstream context (if supported) to bypass FSM.
//    This avoids any dependency on env flags and allows per-instance control.
// -----------------------------------------------------------------------------

type Props = {
  defaultAddress?: string;
  bypassDefaultFsm?: boolean; // ⬅️ per-instance FSM bypass (defaults to false)
};

export default function AddressSelect({ defaultAddress, bypassDefaultFsm = true }: Props) {
  const {
      instanceId,
      manualEntry,
      setManualEntry,
      validHexInput,
      debouncedHexInput,
      handleHexInputChange,
      setInputState,
      // The context MAY expose an optional setter to inform the FSM layer to bypass.
      // We only call it if it exists to remain backward compatible.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBypassFSM: _setBypassFSMOptional,
  } = useAssetSelectContext() as any;

  const setBypassFSM = typeof _setBypassFSMOptional === 'function' ? _setBypassFSMOptional : undefined;

  debugLog.log('🆔 context instanceId:', instanceId);
  debugLog.log('✅ AddressSelect function START');

  // Reflect prop -> context (if supported), so upstream hooks like useFSMStateManager can skip running
  useEffect(() => {
    if (setBypassFSM) {
      setBypassFSM(!!bypassDefaultFsm);
      debugLog.log(`⏭️ [${instanceId}] setBypassFSM(${String(!!bypassDefaultFsm)})`);
    } else if (bypassDefaultFsm) {
      // Even if context does not support a global bypass, we still mute local "kick" calls below.
      debugLog.warn(`⏭️ [${instanceId}] bypassDefaultFsm=true but context has no setBypassFSM; will locally avoid FSM kicks.`);
    }
  }, [bypassDefaultFsm, setBypassFSM, instanceId]);

  useEffect(() => {
    debugLog.log(
      `🔄 debouncedHexInput → "${debouncedHexInput}" (manualEntry=${String(manualEntry)}, bypass=${String(bypassDefaultFsm)})`
    );
  }, [debouncedHexInput, manualEntry, bypassDefaultFsm]);

  const [enforceManualTrue, setEnforceManualTrue] = useState(false);
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

  const armEnforcementForThisTick = () => {
    setEnforceManualTrue(true);
    requestAnimationFrame(() => setEnforceManualTrue(false));
  };

  // ─────────────────────────────────────────────────────────────
  // Prefill input from defaultAddress (BigInt-safe; only when provided)
  // Runs on mount and whenever defaultAddress changes.
  // Avoids loops by checking against current validHexInput.
  // If bypassDefaultFsm is true, we DO NOT kick FSM here.
  // ─────────────────────────────────────────────────────────────
  const lastAppliedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const next = (defaultAddress ?? '').trim();
    if (!next) return;

    if (lastAppliedRef.current === next && validHexInput === next) return;

    debugLog.log?.(
      `🧩 Applying defaultAddress "${next.slice(0, 8)}…"; current validHexInput="${validHexInput}" (bypass=${String(bypassDefaultFsm)})`
    );

    // Mark as manual so UI stays in "manual entry" mode
    setManualEntry(true);

    // Kick FSM only when NOT bypassing
    if (!bypassDefaultFsm) {
      setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Default Address)');
    } else {
      debugLog.log('⏭️ Bypass active: not kicking FSM on defaultAddress apply');
    }

    // Push value into context (not user-typed, but OK to pass true for simplicity)
    handleHexInputChange(next, true);

    lastAppliedRef.current = next;
  }, [defaultAddress, validHexInput, setManualEntry, setInputState, handleHexInputChange, bypassDefaultFsm]);

  return (
    <div id='AddressSelectDiv' className='flex flex-col gap-[4px] p-0'>
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          debugLog.log('✏️ [HexAddressInput] onChange:', val);
          armEnforcementForThisTick();
          setManualEntry(true);

          // Kick FSM only when NOT bypassing
          if (!bypassDefaultFsm) {
            setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Manual Entry)');
          } else {
            debugLog.log('⏭️ Bypass active: not kicking FSM on manual entry');
          }

          // Trace the handler acceptance
          debugLog.log?.(
            `✏️ [HexAddressInput] calling handleHexInputChange("${val.slice(0, 6)}…", true)`
          );
          const accepted = handleHexInputChange(val, true);
          debugLog.log?.(`✏️ handleHexInputChange accepted=${accepted}`);
        }}
        placeholder='Enter address'
        statusEmoji=''
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
