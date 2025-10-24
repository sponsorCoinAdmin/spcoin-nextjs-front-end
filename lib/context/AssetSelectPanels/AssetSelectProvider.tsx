// File: lib/context/AssetSelectPanels/AssetSelectProvider.tsx
'use client';

import React, { ReactNode, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Address } from 'viem';

import { AssetSelectContext } from './useAssetSelectContext';
import { SP_COIN_DISPLAY, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { AssetSelectBag, isTokenSelectBag } from '@/lib/context/structure/types/panelBag';
import { useAssetSelectDisplay } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { useInstanceId } from './hooks/useInstanceId';
import { useFeedType } from './hooks/useFeedType';
import { usePanelBag } from './hooks/usePanelBag';
import { useValidatedAsset } from './hooks/useValidatedAsset';
// ⬇️ REMOVED: global callback bridge
import { useFSMBridge } from './hooks/useFSMBridge';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';

// Toggle all regular debug logs with this flag
const DEBUG_ENABLED =
  (process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true') ||
  (process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true') ||
  true; // keep `true` until LOG_CLEANUP passes, then switch to env-gated

const debugLog = createDebugLogger('AssetSelectProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

// Deep trace for balance/asset handoffs
const TRACE_BALANCE = process.env.NEXT_PUBLIC_TRACE_BALANCE === 'true';

// Small helper that respects DEBUG_ENABLED so we can safely remove raw console usage later
const rawLog = (...args: any[]) => {
  if (!DEBUG_ENABLED) return;
  // eslint-disable-next-line no-console
  console.log(...args);
};

function snapshotAsset(asset: TokenContract | WalletAccount | undefined) {
  if (!asset) return { kind: 'unknown', note: 'asset is undefined' };
  const a: any = asset;
  return {
    kind:
      typeof a?.decimals === 'number' || typeof a?.symbol === 'string'
        ? 'TokenContract'
        : 'WalletAccount/Other',
    address: a?.address ?? '(none)',
    symbol: a?.symbol ?? '(none)',
    name: a?.name ?? '(none)',
    decimals: typeof a?.decimals === 'number' ? a.decimals : '(n/a)',
    logoURL: a?.logoURL ?? undefined,
    website: a?.website ?? undefined,
  };
}

type Props = {
  children: ReactNode;
  closePanelCallback: (fromUser?: boolean) => void;
  setSelectedAssetCallback: (asset: TokenContract | WalletAccount) => void;
  containerType: SP_COIN_DISPLAY;
  initialPanelBag?: AssetSelectBag;
};

export const AssetSelectProvider = ({
  children,
  closePanelCallback,
  setSelectedAssetCallback,
  containerType,
  initialPanelBag,
}: Props) => {
  const instanceId = useInstanceId(containerType);
  const feedType = useFeedType(containerType);

  const { panelBag, setPanelBag } = usePanelBag(initialPanelBag, containerType);

  // Local UI state
  const [manualEntry, setManualEntry] = useState(false);
  const [bypassFSM, setBypassFSM] = useState(false); // per-instance runner bypass

  // Mount log
  useEffect(() => {
    debugLog.log?.(
      `🔧 mount: containerType=${SP_COIN_DISPLAY[containerType]}, feedType=${FEED_TYPE[feedType]}, instanceId=${instanceId}, initialBag=${
        initialPanelBag ? JSON.stringify(initialPanelBag) : '—'
      }`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only

  // State change logs (gated)
  useEffect(() => {
    rawLog('[AssetSelectProvider] state change: manualEntry', { instanceId, manualEntry });
  }, [manualEntry, instanceId]);

  useEffect(() => {
    rawLog('[AssetSelectProvider] state change: bypassFSM', { instanceId, bypassFSM });
  }, [bypassFSM, instanceId]);

  const {
    validatedAsset,
    setValidatedAsset,
    validatedAssetNarrow,
    setValidatedAssetNarrow,
  } = useValidatedAsset<TokenContract | WalletAccount>();

  // Parent commit callback with trace
  const tracedSetSelectedAssetCallback = useCallback(
    (asset: TokenContract | WalletAccount) => {
      rawLog('[AssetSelectProvider] setSelectedAssetCallback(IN)', {
        instanceId,
        containerType: SP_COIN_DISPLAY[containerType],
        feedType: FEED_TYPE[feedType],
        asset: snapshotAsset(asset),
      });

      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.groupCollapsed('[TRACE][AssetSelectProvider] setSelectedAssetCallback IN');
        // eslint-disable-next-line no-console
        console.log({ instanceId, containerType: SP_COIN_DISPLAY[containerType], feedType: FEED_TYPE[feedType] });
        // eslint-disable-next-line no-console
        console.log('incoming asset snapshot:', snapshotAsset(asset));
        // eslint-disable-next-line no-console
        console.trace('callsite');
        // eslint-disable-next-line no-console
        console.groupEnd();
      }

      // Delegate to parent
      setSelectedAssetCallback(asset);

      rawLog('[AssetSelectProvider] setSelectedAssetCallback(OUT → delegated to parent)', {
        instanceId,
        wroteAddress: (asset as any)?.address ?? '(none)',
        wroteSymbol: (asset as any)?.symbol ?? '(none)',
      });

      if (TRACE_BALANCE) {
        // eslint-disable-next-line no-console
        console.log('[TRACE][AssetSelectProvider] setSelectedAssetCallback OUT (delegated to parent)', {
          instanceId,
          wroteAddress: (asset as any)?.address ?? '(none)',
          wroteSymbol: (asset as any)?.symbol ?? '(none)',
        });
      }
    },
    [setSelectedAssetCallback, instanceId, containerType, feedType]
  );

  // ⬇️ REPLACEMENT for the removed global bridge: thin local “fire*” wrappers.
  const fireClosePanel = useCallback(
    (fromUser?: boolean) => {
      closePanelCallback(fromUser);
    },
    [closePanelCallback]
  );

  const fireSetTradingToken = useCallback(
    (asset: TokenContract | WalletAccount) => {
      tracedSetSelectedAssetCallback(asset);
    },
    [tracedSetSelectedAssetCallback]
  );

  const { resetPreview, showErrorPreview, showAssetPreview } = useAssetSelectDisplay();

  const peerAddress = useMemo<Address | undefined>(() => {
    const peer = panelBag && isTokenSelectBag(panelBag)
      ? (panelBag.peerAddress as Address | undefined)
      : undefined;

    rawLog('[AssetSelectProvider] derive peerAddress', {
      instanceId,
      containerType: SP_COIN_DISPLAY[containerType],
      peerAddress: peer ?? null,
    });

    return peer;
  }, [panelBag, containerType, instanceId]);

  // Bridge (receives bypassFSM)
  const {
    inputState,
    setInputState,
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
    dumpInputFeed,
    dumpFSM,
  } = useFSMBridge({
    containerType,
    feedType,
    instanceId,
    peerAddress,
    manualEntry,
    validatedAsset,
    setValidatedAsset,
    fireClosePanel,
    fireSetTradingToken,
    resetPreview,
    showAssetPreview,
    showErrorPreview,
    resetHexInputExternal: undefined,
    bypassFSM,
  });

  // inputState transitions (gated)
  const prevStateRef = useRef(inputState);
  useEffect(() => {
    if (prevStateRef.current !== inputState) {
      rawLog('[AssetSelectProvider] inputState transition', {
        instanceId,
        from: prevStateRef.current,
        to: inputState,
      });
      prevStateRef.current = inputState;
    }
  }, [inputState, instanceId]);

  // Deep trace: snapshot when bridge produces a validatedAsset
  if (TRACE_BALANCE && validatedAsset) {
    // eslint-disable-next-line no-console
    console.log('[TRACE][AssetSelectProvider] validatedAsset snapshot (pre-commit hint)', {
      instanceId,
      containerType: SP_COIN_DISPLAY[containerType],
      snapshot: snapshotAsset(validatedAsset),
    });
  }

  // Log input feed updates at key debounce edges (gated)
  const lastDebouncedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (debouncedHexInput !== lastDebouncedRef.current) {
      rawLog('[AssetSelectProvider] debouncedHexInput', {
        instanceId,
        debouncedHexInput,
        manualEntry,
        bypassFSM,
      });
      lastDebouncedRef.current = debouncedHexInput;
    }
  }, [debouncedHexInput, manualEntry, bypassFSM, instanceId]);

  // Context-facing wrappers (same names for compatibility)
  const setTradingTokenCallbackCtx = useCallback(
    (a: TokenContract | WalletAccount) => {
      rawLog('[AssetSelectProvider] ctx.setTradingTokenCallback → fireSetTradingToken(IN)', {
        instanceId,
        asset: snapshotAsset(a),
      });
      fireSetTradingToken(a);
      rawLog('[AssetSelectProvider] ctx.setTradingTokenCallback → fireSetTradingToken(OUT)');
    },
    [fireSetTradingToken, instanceId]
  );

  const closePanelCallbackCtx = useCallback(() => {
    rawLog('[AssetSelectProvider] ctx.closePanelCallback → fireClosePanel(IN)', { instanceId });
    fireClosePanel(true);
    rawLog('[AssetSelectProvider] ctx.closePanelCallback → fireClosePanel(OUT)');
  }, [fireClosePanel, instanceId]);

  const ctxValue = useMemo(
    () => ({
      // FSM state + controls
      inputState,
      setInputState,

      // Validated asset (token-focused API kept for backwards compatibility)
      validatedAsset: validatedAssetNarrow,
      setValidatedAsset: setValidatedAssetNarrow,

      // Local flags
      manualEntry,
      setManualEntry,

      // Bypass control exposed to children (e.g., AddressSelect)
      bypassFSM,
      setBypassFSM,

      // Token-only helpers (legacy naming preserved)
      setValidatedToken: (t?: TokenContract) => setValidatedAssetNarrow(t),
      setValidatedWallet: (_?: WalletAccount) => {},

      // Debug dumps
      dumpFSMContext: (h?: string) => dumpFSM(h ?? ''),
      dumpAssetSelectContext: (h?: string) => dumpFSM(h ?? ''), // keep alias for now

      // Input feed
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpInputFeedContext: (h?: string) => dumpInputFeed(h ?? ''),

      // Identity / meta
      containerType,
      feedType,
      instanceId,

      // Parent bridges exposed to children (legacy name preserved) — now direct
      closePanelCallback: closePanelCallbackCtx,
      setTradingTokenCallback: setTradingTokenCallbackCtx,

      // Panel bag
      panelBag,
      setPanelBag,

      // Preview controls
      showErrorPreview,
      showAssetPreview,
      resetPreview,
    }),
    [
      inputState,
      validatedAssetNarrow,
      setValidatedAssetNarrow,
      manualEntry,
      bypassFSM,
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      containerType,
      feedType,
      instanceId,
      closePanelCallbackCtx,
      setTradingTokenCallbackCtx,
      panelBag,
      setPanelBag,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
      dumpInputFeed,
      dumpFSM,
    ],
  );

  return <AssetSelectContext.Provider value={ctxValue}>{children}</AssetSelectContext.Provider>;
};

export default AssetSelectProvider;
