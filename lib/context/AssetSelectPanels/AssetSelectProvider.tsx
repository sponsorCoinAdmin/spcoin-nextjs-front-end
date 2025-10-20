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
  const [bypassFSM, setBypassFSM] = useState(false); // ⬅️ per-instance runner bypass

  const {
    validatedAsset,
    setValidatedAsset,
    validatedAssetNarrow,
    setValidatedAssetNarrow,
  } = useValidatedAsset<TokenContract | WalletAccount>();

  const { fireClosePanel, fireSetTradingToken } = useProviderCallbacks(
    { closePanelCallback, setTradingTokenCallback: setSelectedAssetCallback },
    instanceId,
  );

  const { resetPreview, showErrorPreview, showAssetPreview } = useAssetSelectDisplay();

  const peerAddress = useMemo<Address | undefined>(() => {
    return panelBag && isTokenSelectBag(panelBag)
      ? (panelBag.peerAddress as Address | undefined)
      : undefined;
  }, [panelBag]);

  // Bridge (now receives bypassFSM)
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
    bypassFSM, // ⬅️ pass down
  });

  const mountedRef = useRef(false);
  if (!mountedRef.current) {
    mountedRef.current = true;
    debugLog.log?.(
      `🔧 mount: containerType=${SP_COIN_DISPLAY[containerType]}, feedType=${FEED_TYPE[feedType]}, instanceId=${instanceId}, initialBag=${
        initialPanelBag ? JSON.stringify(initialPanelBag) : '—'
      }`
    );
  }

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

      // 🔧 Bypass control exposed to children (e.g., AddressSelect)
      bypassFSM,
      setBypassFSM,

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
