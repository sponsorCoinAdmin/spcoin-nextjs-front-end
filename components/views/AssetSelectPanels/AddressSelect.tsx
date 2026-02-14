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

  /** When true, display address as bxxxb ... bxxxb in the label instead of HexAddressInput. */
  shortAddr?: boolean;

  /** Optional text prefix for the displayed address label. */
  preText?: string;

  /** When true, input width tracks text size instead of filling available width. */
  fitToText?: boolean;
};

export default function AddressSelect({
  defaultAddress,
  bypassDefaultFsm = false,
  useActiveAddr = false,
  makeEditable = true,
  callingParent,
  showPreview = true,
  shortAddr = false,
  preText,
  fitToText = false,
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

  debugLog.log?.('🆔 context', {
    callingParent: callingParent ?? '(none)',
    instanceId,
  });
  debugLog.log?.('✅ AddressSelect function START', {
    callingParent: callingParent ?? '(none)',
  });
  debugLog.log?.('[props]', {
    callingParent: callingParent ?? '(none)',
    defaultAddress: defaultAddress ?? '(undefined)',
    bypassDefaultFsm,
    useActiveAddr,
    makeEditable,
    activeAddr: activeAddr || '(none)',
    shortAddr,
    preText: preText ?? '(undefined)',
    fitToText,
  });

  // Enforce manualEntry=true when AddressSelect mounts
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

  // ────────────────────────────────────────────────────────────
  // Display label formatting: shortAddr + preText
  // ────────────────────────────────────────────────────────────

  const baseDisplayAddress = useMemo(() => {
    // Prefer the current input if present, otherwise fall back to resolved default
    const fromInput = (validHexInput ?? '').trim();
    if (fromInput.length > 0) return fromInput;
    return (resolvedDefault ?? '').trim();
  }, [validHexInput, resolvedDefault]);

  const formattedAddress = useMemo(() => {
    if (!baseDisplayAddress) return '';

    if (!shortAddr) return baseDisplayAddress;

    // Short form: bxxxb ... bxxxb with ~15 chars either side.
    if (baseDisplayAddress.length <= 36) {
      // For shorter addresses, just wrap with spaces.
      return ` ${baseDisplayAddress} `;
    }

    const start = baseDisplayAddress.slice(0, 15);
    const end = baseDisplayAddress.slice(-15);
    // Leading/trailing blanks plus spaced ellipsis → " bxxxb ... bxxxb "
    return ` ${start} ... ${end} `;
  }, [baseDisplayAddress, shortAddr]);

  const hasLabel = useMemo(() => {
    return !!formattedAddress || !!(preText && preText.trim().length > 0);
  }, [formattedAddress, preText]);

  const showShortLabel = shortAddr && hasLabel;
  const showHexInput = !shortAddr;
  const fitWidthCh = Math.max((baseDisplayAddress || '').length, 8);

  return (
    <div id="AddressSelectDiv" className="flex flex-col gap-[4px] p-0">
      {/* Label row: preText on the left, shortened address in the container.
          ONLY shown when shortAddr === true. */}
      {showShortLabel && (
        <div className="flex items-center gap-2 mb-1 text-sm text-slate-300/80">
          {preText && preText.trim().length > 0 && (
            <span className="whitespace-nowrap">
              {preText.trim()}
            </span>
          )}

          {formattedAddress && (
            // Shortened address pill:
            // same bg/fg/rounding as HexAddressInput outer div,
            // fills remaining width, text centered.
            <div
              className="
                flex-1
                min-w-0
                flex
                items-center
                justify-center
                px-1
                py-1
                gap-2
                bg-[#243056]
                text-[#5981F3]
                text-base
                w-full
                mb-0
                rounded-[22px]
              "
            >
              <span className="w-full text-center font-mono break-all" title={baseDisplayAddress}>
                {formattedAddress}
              </span>
            </div>
          )}
        </div>
      )}

      {/* HexAddressInput: ONLY shown when shortAddr === false */}
      {showHexInput && (
        <HexAddressInput
          inputValue={validHexInput}
          fullWidth={!fitToText}
          fitWidthCh={fitToText ? fitWidthCh : undefined}
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
      )}

      {showPreview && (
        <>
          <ErrorAssetPreview />
          <RenderAssetPreview />
        </>
      )}
    </div>
  );
}
