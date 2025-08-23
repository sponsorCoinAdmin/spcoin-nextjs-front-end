// File: lib/context/ScrollSelectPanels/AssetSelectProvider.tsx
'use client';

import React, { ReactNode, useState, useCallback, useMemo, useEffect } from 'react';

import { AssetSelectContext } from './useAssetSelectContext';
import { SP_COIN_DISPLAY, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { dumpFSMContext, dumpInputFeedContext } from '@/lib/hooks/inputValidations/utils/debugContextDump';
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import { AssetSelectBag, isTokenSelectBag } from '@/lib/context/structure/types/panelBag';
import { useAssetSelectDisplay } from '@/lib/context/Providers/AssetSelect/AssetSelectDisplayProvider';
import { useLatestRef } from '@/lib/hooks/useLatestRef';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const feedType = FEED_TYPE.TOKEN_LIST;
const DBG = (process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true') || (process.env.NEXT_PUBLIC_FSM === 'true');
const debug = createDebugLogger('AssetSelectProvider', DBG);

type Props = {
  children: ReactNode;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  containerType: SP_COIN_DISPLAY;
  initialPanelBag?: AssetSelectBag;
};

export const AssetSelectProvider = ({
  children,
  closePanelCallback,
  setTradingTokenCallback,
  containerType,
  initialPanelBag,
}: Props) => {
  // Per-instance id for logs/debug (BUY/SELL/main)
  const instanceId = useMemo(() => {
    switch (containerType) {
      case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL: return 'buy';
      case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL: return 'sell';
      default: return 'main';
    }
  }, [containerType]);

  // state
  const [validatedAsset, setValidatedAssetRaw] = useState<WalletAccount | TokenContract>();
  const [manualEntry, setManualEntry] = useState(false);
  const [panelBag, setPanelBag] = useState<AssetSelectBag>(
    initialPanelBag ?? ({ type: containerType } as AssetSelectBag)
  );

  const manualEntryRef = useLatestRef(manualEntry);
  const parentRef = useLatestRef({ closePanelCallback, setTradingTokenCallback });

  // equality-guarded setter
  const setValidatedAsset = useCallback((next?: WalletAccount | TokenContract) => {
    const prev = validatedAsset as TokenContract | undefined;
    const nxt = next as TokenContract | undefined;
    if (prev?.address === nxt?.address && prev?.symbol === nxt?.symbol) return;
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  // peer for duplicate-validate on token-select panel
  const peerAddress = isTokenSelectBag(panelBag) ? panelBag.peerAddress : undefined;

  // stable wrappers for the FSM hook
  const fireSetTradingToken = useCallback((asset: TokenContract | WalletAccount) => {
    parentRef.current.setTradingTokenCallback(asset);
  }, [parentRef]);

  const fireClosePanel = useCallback((fromUser: boolean) => {
    parentRef.current.closePanelCallback(fromUser);
  }, [parentRef]);

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
  } = useFSMStateManager({
    containerType,
    feedType,
    instanceId,
    setValidatedAsset,
    closePanelCallback: fireClosePanel,
    setTradingTokenCallback: fireSetTradingToken,
    peerAddress,
    manualEntry: manualEntryRef.current,
  });

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[AssetSelectProvider]', {
      instanceId,
      containerType,
      feedType,
      inputState,
      stateName: InputState[inputState] ?? String(inputState),
    });
  }, [inputState, containerType, feedType, instanceId]);

  /**
   * Terminal handling (explicit, symmetric for BUY/SELL):
   * - UPDATE_VALIDATED_ASSET: commit to parent, then advance to CLOSE_SELECT_PANEL
   * - CLOSE_SELECT_PANEL: call close callbacks and cleanup, then reset to EMPTY_INPUT
   */
  useEffect(() => {
    if (inputState === InputState.UPDATE_VALIDATED_ASSET) {
      if (validatedAsset) {
        debug.log(`[${instanceId}] commit → parent.setTradingTokenCallback`, {
          address: (validatedAsset as any)?.address,
          symbol: (validatedAsset as any)?.symbol,
        });
        fireSetTradingToken(validatedAsset);
      } else {
        debug.warn(`[${instanceId}] UPDATE_VALIDATED_ASSET without validatedAsset`);
      }
      setInputState(InputState.CLOSE_SELECT_PANEL, `Provider(${instanceId}) commit → close`);
      return;
    }

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      debug.log(`[${instanceId}] closing panel (calling closePanelCallback)`);
      try {
        fireClosePanel(true);
      } finally {
        // Cleanup after signaling close so unmount happens cleanly
        setValidatedAssetRaw(undefined);
        resetHexInput();
        setManualEntry(false);
        setInputState(InputState.EMPTY_INPUT, `Provider(${instanceId}) closed`);
      }
    }
  }, [
    inputState,
    validatedAsset,
    fireSetTradingToken,
    fireClosePanel,
    setInputState,
    resetHexInput,
    instanceId,
  ]);

  // optional dumps (tied to env flags)
  const dumpInputFeed = useCallback(
    (header?: string) => {
      if (!DBG) return;
      dumpInputFeedContext(header ?? '', validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid, instanceId);
    },
    [validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid, instanceId]
  );

  const dumpAssetSelect = useCallback(
    (header?: string) => {
      if (!DBG) return;
      dumpFSMContext(header ?? '', inputState, validatedAsset as TokenContract | undefined, instanceId);
      dumpInputFeed(header ?? '');
    },
    [inputState, validatedAsset, dumpInputFeed, instanceId]
  );

  const { showErrorPreview, showAssetPreview, resetPreview } = useAssetSelectDisplay();

  const contextValue = useMemo(
    () => ({
      inputState,
      setInputState,
      validatedAsset,
      setValidatedAsset,

      manualEntry,
      setManualEntry,

      setValidatedToken: (t?: TokenContract) => setValidatedAsset(t),
      setValidatedWallet: (_?: WalletAccount) => {},

      dumpFSMContext: (h?: string) => dumpFSMContext(h ?? '', inputState, validatedAsset as TokenContract | undefined, instanceId),
      dumpAssetSelectContext: dumpAssetSelect,

      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpInputFeedContext: dumpInputFeed,

      containerType,
      feedType,

      closePanelCallback: (fromUser?: boolean) => parentRef.current.closePanelCallback(!!fromUser),
      setTradingTokenCallback: (a: TokenContract | WalletAccount) => parentRef.current.setTradingTokenCallback(a),

      instanceId,

      panelBag,
      setPanelBag,

      showErrorPreview,
      showAssetPreview,
      resetPreview,
    }),
    [
      inputState,
      setInputState,
      validatedAsset,
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
      dumpInputFeed,
      dumpAssetSelect,
      panelBag,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
      parentRef,
      setValidatedAsset,
      instanceId,
    ]
  );

  return (
    <AssetSelectContext.Provider value={contextValue}>
      {children}
    </AssetSelectContext.Provider>
  );
};

export default AssetSelectProvider;
