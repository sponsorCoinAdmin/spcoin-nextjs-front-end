// File: lib/context/AssetSelectPanels/AssetSelectProvider.tsx
'use client';

import type { ReactNode } from 'react';
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Address } from 'viem';

import { AssetSelectContext } from './useAssetSelectContext';
import type { TokenContract, WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';
import { isTokenSelectBag } from '@/lib/context/structure/types/panelBag';
import { useAssetSelectDisplay } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { useInstanceId } from './hooks/useInstanceId';
import { useFeedType } from './hooks/useFeedType';
import { usePanelBag } from './hooks/usePanelBag';
import { useValidatedAsset } from './hooks/useValidatedAsset';
import { useFSMBridge } from './hooks/useFSMBridge';

const LOG_TIME = false as const;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
 console.log("*** ENTERING *** AssetSelectProvider()")

// Env-gated logging only
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';

const debugLog = createDebugLogger('AssetSelectProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

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

  // Call once (Rules of Hooks)
  const {
    activeSubDisplay,
    setActiveSubDisplay,
    resetPreview,
    showAssetPreview,
    showErrorPreview,
  } = useAssetSelectDisplay();

  // ⬇️ Minimal change: default manualEntry = true (so every mount starts "manual")
  const [manualEntry, _setManualEntry] = useState(true);
  const [bypassFSM, setBypassFSM] = useState(false);

  useEffect(() => {
    debugLog.log?.('mount', {
      instanceId,
      container: SP_COIN_DISPLAY[containerType],
      feed: FEED_TYPE[feedType],
      hasInitialBag: !!initialPanelBag,
    });
    // Ensure the default is enforced at mount as a safeguard
    _setManualEntry(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    debugLog.log?.('manualEntry changed', {
      instanceId,
      container: SP_COIN_DISPLAY[containerType],
      manualEntry,
    });
  }, [manualEntry, instanceId, containerType]);

  const {
    validatedAsset,
    setValidatedAsset,
    validatedAssetNarrow,
    setValidatedAssetNarrow,
  } = useValidatedAsset<TokenContract | WalletAccount>();

  // Peer address derived from panelBag
  const peerAddress = useMemo<Address | undefined>(() => {
    return panelBag && isTokenSelectBag(panelBag)
      ? (panelBag.peerAddress as Address | undefined)
      : undefined;
  }, [panelBag]);

  // Bridge to FSM
  const {
    inputState,
    setInputState: _setInputState,
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange: _handleHexInputChange,
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
    fireClosePanel: (fromUser?: boolean) => closePanelCallback(fromUser),
    fireSetTradingToken: (asset: TokenContract | WalletAccount) => setSelectedAssetCallback(asset),
    resetPreview,
    showAssetPreview,
    showErrorPreview,
    resetHexInputExternal: undefined,
    bypassFSM,
  });

  // ---- Debug wrappers (no behavior change) ----

  const setManualEntry = useCallback(
    (flag: boolean) => {
      debugLog.log?.('setManualEntry', { instanceId, fromState: manualEntry, toState: flag });
      _setManualEntry(flag);
    },
    [instanceId, manualEntry]
  );

  const setInputState = useCallback(
    (state: any, source?: string) => {
      debugLog.log?.('setInputState', {
        requested: state,
        source: source ?? '(none)',
        instanceId,
        manualEntry,
        debouncedHexInput,
      });
      _setInputState(state, source);
    },
    [_setInputState, instanceId, manualEntry, debouncedHexInput]
  );

  const handleHexInputChange = useCallback(
    (raw: string, isManual?: boolean) => {
      debugLog.log?.('handleHexInputChange', {
        rawPreview: raw?.slice(0, 12),
        isManual,
        instanceId,
        manualEntry,
      });
      const res = _handleHexInputChange(raw);
      debugLog.log?.('handleHexInputChange result', { accepted: res });
      return res;
    },
    [_handleHexInputChange, instanceId, manualEntry]
  );

  const setValidatedAssetLogged = useCallback(
    (asset?: TokenContract | WalletAccount) => {
      debugLog.log?.('setValidatedAsset', {
        instanceId,
        manualEntry,
        addr: (asset as any)?.address ?? '(none)',
        sym: (asset as any)?.symbol ?? '(none)',
        name: (asset as any)?.name ?? '(none)',
      });
      setValidatedAsset(asset as any);
    },
    [instanceId, manualEntry, setValidatedAsset]
  );

  // InputState transitions
  const prevStateRef = useRef(inputState);
  useEffect(() => {
    if (prevStateRef.current !== inputState) {
      debugLog.log?.('inputState transition', {
        instanceId,
        from: prevStateRef.current,
        to: inputState,
        manualEntry,
      });
      prevStateRef.current = inputState;
    }
  }, [inputState, instanceId, manualEntry]);

  // Log when validatedAsset changes (guarded)
  const prevValidatedRef = useRef<TokenContract | WalletAccount | undefined>(undefined);
  useEffect(() => {
    if (validatedAsset && validatedAsset !== prevValidatedRef.current) {
      const a: any = validatedAsset;
      debugLog.log?.('validatedAsset changed', {
        instanceId,
        address: a?.address ?? '(none)',
        symbol: a?.symbol ?? '(none)',
        name: a?.name ?? '(none)',
        manualEntry,
      });
      prevValidatedRef.current = validatedAsset;
    }
  }, [validatedAsset, instanceId, manualEntry]);

  // Context-facing wrappers (minimal logging)
  const setTradingTokenCallbackCtx = useCallback(
    (asset: TokenContract | WalletAccount) => {
      debugLog.log?.('setTradingTokenCallback', {
        instanceId,
        manualEntry,
        address: (asset as any)?.address ?? '(none)',
        symbol: (asset as any)?.symbol ?? '(none)',
      });
      setSelectedAssetCallback(asset);
    },
    [instanceId, setSelectedAssetCallback, manualEntry]
  );

  const closePanelCallbackCtx = useCallback(() => {
    debugLog.log?.('closePanelCallback', { instanceId, manualEntry });
    closePanelCallback(true);
  }, [instanceId, closePanelCallback, manualEntry]);

  // 🔸 Always-present no-ops to satisfy strict context type
  const dumpFSMContext = useCallback(
    (h?: string) => {
      if (DEBUG_ENABLED) dumpFSM(h ?? '');
    },
    [dumpFSM]
  );

  const dumpInputFeedContext = useCallback(
    (h?: string) => {
      if (DEBUG_ENABLED) dumpInputFeed(h ?? '');
    },
    [dumpInputFeed]
  );

  // Deprecated alias kept for compatibility — calls FSM dump
  const dumpAssetSelectContext = useCallback(
    (h?: string) => {
      if (DEBUG_ENABLED) dumpFSM(h ?? '');
    },
    [dumpFSM]
  );

  // Also required by the type; keep as no-op unless you intend to support it
  const setValidatedWallet = useCallback((_?: WalletAccount) => {
    /* no-op: deprecated */
  }, []);

  // Build the public context value
  const ctxValue = useMemo(
    () => ({
      // FSM state + controls
      inputState,
      setInputState, // wrapped

      // Validated asset
      validatedAsset: validatedAssetNarrow,
      setValidatedAsset: setValidatedAssetLogged, // wrapped

      // Local flags (compat)
      manualEntry,
      setManualEntry, // wrapped
      bypassFSM,
      setBypassFSM,

      // Token-only legacy helper (compat)
      setValidatedToken: (t?: TokenContract) => setValidatedAssetNarrow(t),

      // Required by AssetSelectContextType
      setValidatedWallet, // no-op (deprecated)
      dumpAssetSelectContext, // compat alias → dumpFSM
      dumpFSMContext, // always present; no-op when disabled
      dumpInputFeedContext, // always present; no-op when disabled

      // Input feed
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange, // wrapped
      resetHexInput,

      // Identity / meta
      containerType,
      feedType,
      instanceId,

      // Parent bridges
      closePanelCallback: closePanelCallbackCtx,
      setTradingTokenCallback: setTradingTokenCallbackCtx,

      // Panel bag
      panelBag,
      setPanelBag,

      // Display controls
      activeSubDisplay,
      setActiveSubDisplay,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
    }),
    [
      inputState,
      validatedAssetNarrow,
      setValidatedAssetLogged,
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
      activeSubDisplay,
      setActiveSubDisplay,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
      setValidatedWallet,
      dumpAssetSelectContext,
      dumpFSMContext,
      dumpInputFeedContext,
    ]
  );

  return <AssetSelectContext.Provider value={ctxValue}>{children}</AssetSelectContext.Provider>;
};

export default AssetSelectProvider;
