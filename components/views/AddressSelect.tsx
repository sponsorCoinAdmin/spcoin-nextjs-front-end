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
    setBypassFSM,
  } = useAssetSelectContext() as any;

  debugLog.log?.('🆔 context instanceId:', instanceId);
  debugLog.log?.('✅ AddressSelect function START');

  // Reflect prop → context
  useEffect(() => {
    if (typeof setBypassFSM === 'function') {
      setBypassFSM(!!bypassDefaultFsm);
      debugLog.log?.(`⏭️ [${instanceId}] setBypassFSM(${String(!!bypassDefaultFsm)})`);
    } else if (bypassDefaultFsm) {
      debugLog.warn?.(
        `⏭️ [${instanceId}] bypassDefaultFsm=true but context has no setBypassFSM; locally avoiding FSM kicks.`
      );
    }
  }, [bypassDefaultFsm, setBypassFSM, instanceId]);

  useEffect(() => {
    debugLog.log?.(
      `🔄 debouncedHexInput → \`${debouncedHexInput}\` (manualEntry=${String(
        manualEntry
      )}, bypass=${String(bypassDefaultFsm)})`
    );
  }, [debouncedHexInput, manualEntry, bypassDefaultFsm, instanceId]);

  // Keep manualEntry true for the current tick when user types/pastes
  const [enforceManualTrue, setEnforceManualTrue] = useState(false);
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

  const armEnforcementForThisTick = () => {
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
      `🧩 Applying defaultAddress \`${next.slice(0, 8)}…\`; current validHexInput=\`${validHexInput}\` (bypass=${String(
        bypassDefaultFsm
      )})`
    );

    setManualEntry(true); // treat prefill/paste as manual entry

    if (!bypassDefaultFsm) {
      setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Default Address)');
    } else {
      debugLog.log?.('⏭️ Bypass active: not kicking FSM on defaultAddress apply');
    }

    handleHexInputChange(next, true);
    lastAppliedRef.current = next;
  }, [
    defaultAddress,
    validHexInput,
    setManualEntry,
    setInputState,
    handleHexInputChange,
    bypassDefaultFsm,
    instanceId,
  ]);

  return (
    <div id='AddressSelectDiv' className='flex flex-col gap-[4px] p-0'>
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          debugLog.log?.('✏️ [HexAddressInput] onChange:', val);
          armEnforcementForThisTick();
          setManualEntry(true);

          if (!bypassDefaultFsm) {
            setInputState(InputState.EMPTY_INPUT, 'AddressSelect (Manual Entry)');
          } else {
            debugLog.log?.('⏭️ Bypass active: not kicking FSM on manual entry');
          }

          const accepted = handleHexInputChange(val, true);
          debugLog.log?.(
            `✏️ [HexAddressInput] handleHexInputChange(\`${val.slice(0, 6)}…\`, true) → accepted=${accepted}`
          );
        }}
        placeholder='Enter address'
        statusEmoji=''
      />
      <ErrorAssetPreview />
      <RenderAssetPreview />
    </div>
  );
}
