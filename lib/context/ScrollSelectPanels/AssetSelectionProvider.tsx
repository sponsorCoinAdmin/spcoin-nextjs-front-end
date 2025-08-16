// File: lib/context/ScrollSelectPanels/AssetSelectionProvider.tsx
'use client';

import React, { ReactNode, useState, useCallback, useMemo } from 'react';

import { AssetSelectionContext } from './useAssetSelectionContext';
import { SP_COIN_DISPLAY, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';

import { dumpFSMContext, dumpInputFeedContext } from '@/lib/hooks/inputValidations/utils/debugContextDump';
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import { AssetSelectionBag, isTokenSelectBag } from '@/lib/context/ScrollSelectPanels/structure/types/panelBag';
import { useAssetSelectionDisplay } from '@/lib/context/AssetSelection/AssetSelectionDisplayProvider';
import { useFSMTerminals } from '@/lib/hooks/inputValidations/FSM_Core/useFSMTerminals';
import { useLatestRef } from '@/lib/hooks/useLatestRef'; // ⬅️ NEW

const instanceId = 'main';
const feedType = FEED_TYPE.TOKEN_LIST;
const DBG = (process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true') || (process.env.NEXT_PUBLIC_FSM === 'true');

type Props = {
  children: ReactNode;
  closePanelCallback: (fromUser: boolean) => void;
  setTradingTokenCallback: (asset: TokenContract | WalletAccount) => void;
  containerType: SP_COIN_DISPLAY;
  initialPanelBag?: AssetSelectionBag;
};

export const AssetSelectionProvider = ({
  children,
  closePanelCallback,
  setTradingTokenCallback,
  containerType,
  initialPanelBag,
}: Props) => {
  // state
  const [validatedAsset, setValidatedAssetRaw] = useState<WalletAccount | TokenContract>();
  const [manualEntry, setManualEntry] = useState(false);
  const [panelBag, setPanelBag] = useState<AssetSelectionBag>(initialPanelBag ?? ({ type: containerType } as AssetSelectionBag));

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

  // SELL/terminal fallbacks (reusable hook)
  useFSMTerminals({
    inputState,
    validatedAsset,
    onForwardAsset: fireSetTradingToken,
    onClose: (fromUser) => fireClosePanel(fromUser),
    onCleanup: () => {
      setValidatedAssetRaw(undefined);
      resetHexInput();
      setManualEntry(false);
      setInputState(InputState.EMPTY_INPUT);
    },
    debug: DBG,
  });

  // optional dumps (tied to env flags)
  const dumpInputFeed = useCallback(
    (header?: string) => {
      if (!DBG) return;
      dumpInputFeedContext(header ?? '', validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid, instanceId);
    },
    [validHexInput, debouncedHexInput, failedHexInput, failedHexCount, isValid]
  );

  const dumpAssetSelection = useCallback(
    (header?: string) => {
      if (!DBG) return;
      dumpFSMContext(header ?? '', inputState, validatedAsset as TokenContract | undefined, instanceId);
      dumpInputFeed(header ?? '');
    },
    [inputState, validatedAsset, dumpInputFeed]
  );

  const { showErrorPreview, showAssetPreview, resetPreview } = useAssetSelectionDisplay();

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
      dumpAssetSelectionContext: dumpAssetSelection,

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
      dumpAssetSelection,
      panelBag,
      setPanelBag,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
      parentRef,
      setValidatedAsset,
    ]
  );

  return (
    <AssetSelectionContext.Provider value={contextValue}>
      {children}
    </AssetSelectionContext.Provider>
  );
};

export default AssetSelectionProvider;
