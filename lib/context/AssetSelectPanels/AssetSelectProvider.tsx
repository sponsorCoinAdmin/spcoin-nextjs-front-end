// File: lib/context/AssetSelectPanels/AssetSelectProvider.tsx
'use client';

import React, { ReactNode, useMemo, useRef, useState } from 'react';
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
import { useProviderCallbacks } from './hooks/useProviderCallbacks';
import { useFSMBridge } from './hooks/useFSMBridge';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';

const debugLog = createDebugLogger('AssetSelectProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

type Props = {
  children: ReactNode;
  closePanelCallback: (fromUser: boolean) => void;

  /**
   * New, clearer name: the selected asset can be a TokenContract OR a WalletAccount.
   * (We still expose `setTradingTokenCallback` in context for backwards compatibility.)
   */
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
  // Instance identity + feed selection
  const instanceId = useInstanceId(containerType);
  const feedType = useFeedType(containerType);

  // Panel bag state (with logging)
  const { panelBag, setPanelBag } = usePanelBag(initialPanelBag, containerType);

  // Local UI state
  const [manualEntry, setManualEntry] = useState(false);
  const {
    validatedAsset,
    setValidatedAsset,
    validatedAssetNarrow,
    setValidatedAssetNarrow,
  } = useValidatedAsset<TokenContract | WalletAccount>();

  // Parent callback wrappers (stable + debug-safe)
  // NOTE: useProviderCallbacks currently expects `{ setTradingTokenCallback }`.
  // We pass our renamed prop under that key to avoid touching the hook.
  const { fireClosePanel, fireSetTradingToken } = useProviderCallbacks(
    { closePanelCallback, setTradingTokenCallback: setSelectedAssetCallback },
    instanceId,
  );

  // Display bridge (previews)
  const { resetPreview, showErrorPreview, showAssetPreview } = useAssetSelectDisplay();

  // Peer token address is used only for token panels to block duplicates
  const peerAddress = useMemo(
    () => (isTokenSelectBag(panelBag) ? (panelBag.peerAddress as Address | undefined) : undefined),
    [panelBag],
  );

  // Wire FSM <-> provider, handle terminal transitions and preview sync
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
  });

  // Mount log (one-time)
  const mountedRef = useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
    debugLog.log?.(
      `🔧 mount: containerType=${SP_COIN_DISPLAY[containerType]}, feedType=${FEED_TYPE[feedType]}, instanceId=${instanceId}, initialBag=${
        initialPanelBag ? JSON.stringify(initialPanelBag) : '—'
      }`
    );
  }

  // Context value (stable shape)
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

      // Token-only helpers (legacy naming preserved)
      setValidatedToken: (t?: TokenContract) => setValidatedAssetNarrow(t),
      setValidatedWallet: (_?: WalletAccount) => {},

      // Debug dumps
      dumpFSMContext: (h?: string) => dumpFSM(h ?? ''),
      dumpAssetSelectContext: (h?: string) => dumpFSM(h ?? ''),

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

      // Parent bridges exposed to children (legacy name preserved)
      closePanelCallback: () => fireClosePanel(true),
      setTradingTokenCallback: (a: TokenContract | WalletAccount) => fireSetTradingToken(a),
      // If you also want to expose the new name on context (only if your context type allows it):
      // setSelectedAssetCallback: (a: TokenContract | WalletAccount) => fireSetTradingToken(a),

      // Panel bag
      panelBag,
      setPanelBag,

      // Preview controls (if children need them)
      showErrorPreview,
      showAssetPreview,
      resetPreview,
    }),
    [
      inputState,
      setInputState,
      validatedAssetNarrow,
      setValidatedAssetNarrow,
      manualEntry,
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
      fireClosePanel,
      fireSetTradingToken,
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
