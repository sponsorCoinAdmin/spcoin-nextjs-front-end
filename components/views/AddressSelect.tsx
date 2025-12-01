// File: @components/views/AddressSelect.tsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import HexAddressInput from '@/components/shared/utils/HexAddressInput';
import RenderAssetPreview from '@/components/views/sharedPreviews/RenderAssetPreview';
import ErrorAssetPreview from '@/components/views/sharedPreviews/ErrorAssetPreview';

import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useEnsureBoolWhen } from '@/lib/hooks/useSettledState';
import { InputState } from '@/lib/structure/assetSelection';
import { useAssetSelectContext } from '@/lib/context';
import { useExchangeContext } from '@/lib/context/hooks';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_ADDRESS_SELECT === 'true';
const debugLog = createDebugLogger('AddressSelect', DEBUG_ENABLED, LOG_TIME);

type Props = {
  defaultAddress?: string;
  /** If true, this AddressSelect instance disables the FSM runner. */
  bypassDefaultFsm?: boolean;

  /** When true (default), fall back to activeAccount.address if defaultAddress is empty. */
  useActiveAddr?: boolean;

  /** When false, ignore user typing and just display the resolved address. */
  makeEditable?: boolean;

  /** For logging: who is using this AddressSelect instance. */
  callingParent?: string;

  /** Show the Error/Asset preview block under the input (default: true). */
  showPreview?: boolean;
};

export default function AddressSelect({
  defaultAddress,
  bypassDefaultFsm = false,
  useActiveAddr = false,
  makeEditable = true,
  callingParent,
  showPreview = true,
}: Props) {
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

  const { exchangeContext } = useExchangeContext();
  const activeAddrRaw =
    exchangeContext?.accounts?.activeAccount?.address ?? '';
  const activeAddr = activeAddrRaw ? String(activeAddrRaw).trim() : '';

  const resolvedDefault = useMemo(() => {
    const explicit = (defaultAddress ?? '').trim();

    const chosen =
      explicit.length > 0
        ? explicit
        : useActiveAddr && activeAddr.length > 0
        ? activeAddr
        : '';

    debugLog.log?.('[resolvedDefault]', {
      callingParent: callingParent ?? '(none)',
      explicitDefault: explicit || '(empty)',
      activeAddr: activeAddr || '(none)',
      useActiveAddr,
      resolved: chosen || '(empty)',
      instanceId,
    });

    return chosen;
  }, [defaultAddress, activeAddr, useActiveAddr, instanceId, callingParent]);

  debugLog.log?.('🆔 context', { callingParent: callingParent ?? '(none)', instanceId });
  debugLog.log?.('✅ AddressSelect function START', { callingParent: callingParent ?? '(none)' });
  debugLog.log?.('[props]', {
    callingParent: callingParent ?? '(none)',
    defaultAddress: defaultAddress ?? '(undefined)',
    bypassDefaultFsm,
    useActiveAddr,
    makeEditable,
    activeAddr: activeAddr || '(none)',
  });

  // ⬇️ Minimal change: enforce manualEntry=true when AddressSelect mounts
  useEffect(() => {
    setManualEntry(true);
  }, [setManualEntry]);

  // Reflect prop → context
  useEffect(() => {
    if (typeof setBypassFSM === 'function') {
      setBypassFSM(!!bypassDefaultFsm);
      debugLog.log?.(
        `⏭️ [${instanceId}] setBypassFSM(${String(
          !!bypassDefaultFsm,
        )}) (parent=${callingParent ?? 'unknown'})`,
      );
    } else if (bypassDefaultFsm) {
      debugLog.warn?.(
        `⏭️ [${instanceId}] bypassDefaultFsm=true but context has no setBypassFSM; locally avoiding FSM kicks. (parent=${callingParent ?? 'unknown'})`,
      );
    }
  }, [bypassDefaultFsm, setBypassFSM, instanceId, callingParent]);

  useEffect(() => {
    debugLog.log?.(
      `🔄 (parent      = ${callingParent ?? 'unknown'}) debouncedHexInput → \`${debouncedHexInput}\` (manualEntry=${String(
        manualEntry,
      )}, bypass=${String(bypassDefaultFsm)})`,
    );
  }, [debouncedHexInput, manualEntry, bypassDefaultFsm, instanceId, callingParent]);

  // Keep manualEntry true for the current tick when user types/pastes
  const [enforceManualTrue, setEnforceManualTrue] = useState(false);
  useEnsureBoolWhen([manualEntry, setManualEntry], true, enforceManualTrue);

  const armEnforcementForThisTick = () => {
    setEnforceManualTrue(true);
    requestAnimationFrame(() => setEnforceManualTrue(false));
  };

  // Prefill from resolvedDefault (explicit defaultAddress → activeAddr → empty)
  const lastAppliedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const next = resolvedDefault;
    if (!next) {
      debugLog.log?.(
        `[prefill] (parent=${callingParent ?? 'unknown'}) resolvedDefault empty; skipping apply (instanceId=${instanceId})`,
      );
      return;
    }

    if (lastAppliedRef.current === next && validHexInput === next) {
      debugLog.log?.(
        `[prefill] (parent=${callingParent ?? 'unknown'}) resolvedDefault "${next.slice(
          0,
          8,
        )}…" already applied; skipping`,
      );
      return;
    }

    debugLog.log?.(
      `🧩 (parent      = ${callingParent ?? 'unknown'}) Applying resolvedDefault \`${next.slice(
        0,
        8,
      )}…\`; current validHexInput=\`${validHexInput}\` (bypass=${String(
        bypassDefaultFsm,
      )})`,
    );

    setManualEntry(true); // treat prefill/paste as manual entry

    if (!bypassDefaultFsm) {
      setInputState(
        InputState.EMPTY_INPUT,
        'AddressSelect (Resolved Default Address)',
      );
    } else {
      debugLog.log?.(
        '⏭️ Bypass active: not kicking FSM on resolvedDefault apply',
      );
    }

    const accepted = handleHexInputChange(next, true);
    debugLog.log?.(
      `🧩 (parent      = ${callingParent ?? 'unknown'}) handleHexInputChange(\`${next.slice(
        0,
        8,
      )}…\`, true) from prefill → accepted=${accepted}`,
    );

    lastAppliedRef.current = next;
  }, [
    resolvedDefault,
    validHexInput,
    setManualEntry,
    setInputState,
    handleHexInputChange,
    bypassDefaultFsm,
    instanceId,
    callingParent,
  ]);

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      <HexAddressInput
        inputValue={validHexInput}
        onChange={(val) => {
          if (!makeEditable) {
            debugLog.log?.(
              '✏️ [HexAddressInput] input ignored because makeEditable=false',
            );
            return;
          }

          debugLog.log?.('✏️ [HexAddressInput] onChange:', val);
          armEnforcementForThisTick();
          setManualEntry(true);

          if (!bypassDefaultFsm) {
            setInputState(
              InputState.EMPTY_INPUT,
              'AddressSelect (Manual Entry)',
            );
          } else {
            debugLog.log?.(
              '⏭️ Bypass active: not kicking FSM on manual entry',
            );
          }

          const accepted = handleHexInputChange(val, true);
          debugLog.log?.(
            `✏️ [HexAddressInput] handleHexInputChange(\`${val.slice(
              0,
              6,
            )}…\`, true) → accepted=${accepted}`,
          );
        }}
        placeholder="Enter address"
        statusEmoji=""
      />

      {showPreview && (
        <>
          <ErrorAssetPreview />
          <RenderAssetPreview />
        </>
      )}
    </div>
  );
}
