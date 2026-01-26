// File: @/lib/context/AssetSelectPanels/AssetSelectProvider.tsx
'use client';

import type { ReactNode } from 'react';
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';

import { AssetSelectContext } from './useAssetSelectContext';
import type { TokenContract, spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import type { AssetSelectBag } from '@/lib/context/structure/types/panelBag';
import { useAssetSelectDisplay } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { useInstanceId } from './hooks/useInstanceId';
import { useFeedType } from './hooks/useFeedType';
import { usePanelBag } from './hooks/usePanelBag';
import { useValidatedAsset } from './hooks/useValidatedAsset';
import { useFSMBridge } from './hooks/useFSMBridge';

const LOG_TIME = false as const;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';

// Env-gated logging only
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';

const debugLog = createDebugLogger(
  'AssetSelectProvider',
  DEBUG_ENABLED,
  LOG_TIME,
  LOG_LEVEL
);

type Props = {
  children: ReactNode;
  closePanelCallback: (fromUser?: boolean) => void;
  setSelectedAssetCallback: (asset: TokenContract | spCoinAccount) => void;
  containerType: SP_COIN_DISPLAY;
  initialPanelBag?: AssetSelectBag;
  /** Optional: force a specific FEED_TYPE instead of inferring from containerType */
  feedTypeOverride?: FEED_TYPE;
};

function feedLabel(ft?: FEED_TYPE) {
  return typeof ft === 'number' ? FEED_TYPE[ft] : '(none)';
}

function safeKeys(o: any) {
  try {
    return o && typeof o === 'object' ? Object.keys(o) : [];
  } catch {
    return [];
  }
}

export const AssetSelectProvider = ({
  children,
  closePanelCallback,
  setSelectedAssetCallback,
  containerType,
  initialPanelBag,
  feedTypeOverride,
}: Props) => {
  const instanceId = useInstanceId(containerType);

  // Infer feedType from container, but allow explicit override
  const inferredFeedType = useFeedType(containerType);
  const feedType = feedTypeOverride ?? inferredFeedType;

  const { panelBag, setPanelBag } = usePanelBag(initialPanelBag, containerType);

  // Call once (Rules of Hooks)
  const {
    activeSubDisplay,
    setActiveSubDisplay,
    resetPreview,
    showAssetPreview,
    showErrorPreview,
  } = useAssetSelectDisplay();

  // ⬇️ default manualEntry = true (so every mount starts "manual")
  const [manualEntry, _setManualEntry] = useState(true);
  const [bypassFSM, setBypassFSM] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔎 TOP-LEVEL TRACE: prove EXACT inputs that determine where data loads from
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    debugLog.log?.('[mount]', {
      instanceId,
      containerType,
      containerLabel: SP_COIN_DISPLAY[containerType],
      inferredFeedType,
      inferredFeedLabel: feedLabel(inferredFeedType),
      feedTypeOverride,
      overrideFeedLabel: feedLabel(feedTypeOverride),
      finalFeedType: feedType,
      finalFeedLabel: feedLabel(feedType),
      hasInitialBag: !!initialPanelBag,
      initialBagType: (initialPanelBag as any)?.type ?? '(none)',
      initialBagKeys: safeKeys(initialPanelBag),
      initialBag: initialPanelBag ?? null,
    });

    // Ensure default enforced at mount as a safeguard
    _setManualEntry(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Log any runtime changes (hot reload / transitions / provider reuse)
  useEffect(() => {
    debugLog.log?.('[feedType:resolved]', {
      instanceId,
      containerLabel: SP_COIN_DISPLAY[containerType],
      inferredFeedLabel: feedLabel(inferredFeedType),
      overrideFeedLabel: feedLabel(feedTypeOverride),
      finalFeedLabel: feedLabel(feedType),
    });
  }, [instanceId, containerType, inferredFeedType, feedTypeOverride, feedType]);

  // Panel bag evolution (often drives peerAddress / selection behavior)
  useEffect(() => {
    debugLog.log?.('[panelBag]', {
      instanceId,
      containerLabel: SP_COIN_DISPLAY[containerType],
      bagType: (panelBag as any)?.type ?? '(none)',
      bagKeys: safeKeys(panelBag),
      bag: panelBag ?? null,
    });
  }, [panelBag, instanceId, containerType]);

  useEffect(() => {
    debugLog.log?.('[manualEntry]', {
      instanceId,
      containerLabel: SP_COIN_DISPLAY[containerType],
      manualEntry,
    });
  }, [manualEntry, instanceId, containerType]);

  const {
    validatedAsset,
    setValidatedAsset,
    validatedAssetNarrow,
    setValidatedAssetNarrow,
  } = useValidatedAsset<TokenContract | spCoinAccount>();

  // Bridge to FSM (peerAddress is derived inside useFSMBridge)
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
    manualEntry,
    validatedAsset,
    setValidatedAsset,
    fireClosePanel: (fromUser?: boolean) => closePanelCallback(fromUser),
    fireSetTradingToken: (asset: TokenContract | spCoinAccount) =>
      setSelectedAssetCallback(asset),
    resetPreview,
    showAssetPreview,
    showErrorPreview,
    bypassFSM,
  });

  // Trace inputState transitions (lets you align with when feed loads)
  const prevStateRef = useRef(inputState);
  useEffect(() => {
    if (prevStateRef.current !== inputState) {
      debugLog.log?.('[inputState:transition]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        from: prevStateRef.current,
        to: inputState,
        manualEntry,
        feed: feedLabel(feedType),
        debouncedHexInputPreview: (debouncedHexInput ?? '').slice(0, 14),
      });
      prevStateRef.current = inputState;
    }
  }, [
    inputState,
    instanceId,
    containerType,
    manualEntry,
    feedType,
    debouncedHexInput,
  ]);

  // Log when validatedAsset changes (guarded)
  const prevValidatedRef = useRef<TokenContract | spCoinAccount | undefined>(
    undefined
  );
  useEffect(() => {
    if (validatedAsset && validatedAsset !== prevValidatedRef.current) {
      const a: any = validatedAsset;
      debugLog.log?.('[validatedAsset:changed]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        manualEntry,
        feed: feedLabel(feedType),
        address: a?.address ?? '(none)',
        symbol: a?.symbol ?? '(none)',
        name: a?.name ?? '(none)',
      });
      prevValidatedRef.current = validatedAsset;
    }
  }, [validatedAsset, instanceId, containerType, manualEntry, feedType]);

  // ---- Debug wrappers (no behavior change) ----

  const setManualEntry = useCallback(
    (flag: boolean) => {
      debugLog.log?.('[setManualEntry]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        fromState: manualEntry,
        toState: flag,
        feed: feedLabel(feedType),
      });
      _setManualEntry(flag);
    },
    [instanceId, containerType, manualEntry, feedType]
  );

  const setInputState = useCallback(
    (state: any, source?: string) => {
      debugLog.log?.('[setInputState]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        requested: state,
        source: source ?? '(none)',
        manualEntry,
        feed: feedLabel(feedType),
        debouncedHexInputPreview: (debouncedHexInput ?? '').slice(0, 14),
      });
      _setInputState(state, source);
    },
    [
      _setInputState,
      instanceId,
      containerType,
      manualEntry,
      feedType,
      debouncedHexInput,
    ]
  );

  const handleHexInputChange = useCallback(
    (raw: string, isManual?: boolean) => {
      debugLog.log?.('[handleHexInputChange]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        feed: feedLabel(feedType),
        rawPreview: raw?.slice(0, 14),
        isManual,
        manualEntry,
      });
      const res = _handleHexInputChange(raw);
      debugLog.log?.('[handleHexInputChange:result]', {
        instanceId,
        accepted: res,
      });
      return res;
    },
    [_handleHexInputChange, instanceId, containerType, feedType, manualEntry]
  );

  const setValidatedAssetLogged = useCallback(
    (asset?: TokenContract | spCoinAccount) => {
      const a: any = asset;
      debugLog.log?.('[setValidatedAsset]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        manualEntry,
        feed: feedLabel(feedType),
        addr: a?.address ?? '(none)',
        sym: a?.symbol ?? '(none)',
        name: a?.name ?? '(none)',
      });
      setValidatedAsset(asset as any);
    },
    [instanceId, containerType, manualEntry, feedType, setValidatedAsset]
  );

  // Parent bridges (log who is committing/closing)
  const setTradingTokenCallbackCtx = useCallback(
    (asset: TokenContract | spCoinAccount) => {
      const a: any = asset;
      debugLog.log?.('[setTradingTokenCallback]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        manualEntry,
        feed: feedLabel(feedType),
        address: a?.address ?? '(none)',
        symbol: a?.symbol ?? '(none)',
        name: a?.name ?? '(none)',
      });
      setSelectedAssetCallback(asset);
    },
    [instanceId, containerType, setSelectedAssetCallback, manualEntry, feedType]
  );

  const closePanelCallbackCtx = useCallback(() => {
    debugLog.log?.('[closePanelCallback]', {
      instanceId,
      containerLabel: SP_COIN_DISPLAY[containerType],
      manualEntry,
      feed: feedLabel(feedType),
    });
    closePanelCallback(true);
  }, [instanceId, containerType, closePanelCallback, manualEntry, feedType]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔥 CRITICAL: dump wrappers emit debugLog BEFORE dumping internals
  // Use these when you suspect the wrong JSON spec/cached source is being used.
  // ─────────────────────────────────────────────────────────────────────────────

  const dumpFSMContext = useCallback(
    (h?: string) => {
      if (!DEBUG_ENABLED) return;
      debugLog.log?.('[dumpFSMContext]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        feed: feedLabel(feedType),
        hint: h ?? '(none)',
      });
      dumpFSM(h ?? '');
    },
    [dumpFSM, instanceId, containerType, feedType]
  );

  const dumpInputFeedContext = useCallback(
    (h?: string) => {
      if (!DEBUG_ENABLED) return;
      debugLog.log?.('[dumpInputFeedContext]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        feed: feedLabel(feedType),
        hint: h ?? '(none)',
      });
      dumpInputFeed(h ?? '');
    },
    [dumpInputFeed, instanceId, containerType, feedType]
  );

  // Deprecated alias kept for compatibility — calls FSM dump
  const dumpAssetSelectContext = useCallback(
    (h?: string) => {
      if (!DEBUG_ENABLED) return;
      debugLog.log?.('[dumpAssetSelectContext]', {
        instanceId,
        containerLabel: SP_COIN_DISPLAY[containerType],
        feed: feedLabel(feedType),
        hint: h ?? '(none)',
      });
      dumpFSM(h ?? '');
    },
    [dumpFSM, instanceId, containerType, feedType]
  );

  // Required by the type; keep as no-op unless you intend to support it
  const setValidatedWallet = useCallback((_?: spCoinAccount) => {
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
      dumpFSMContext, // wrapped
      dumpInputFeedContext, // wrapped

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
      setInputState,
      validatedAssetNarrow,
      setValidatedAssetLogged,
      manualEntry,
      setManualEntry,
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
      setValidatedAssetNarrow,
      setValidatedWallet,
      dumpAssetSelectContext,
      dumpFSMContext,
      dumpInputFeedContext,
    ]
  );

  return (
    <AssetSelectContext.Provider value={ctxValue}>
      {children}
    </AssetSelectContext.Provider>
  );
};

export default AssetSelectProvider;
