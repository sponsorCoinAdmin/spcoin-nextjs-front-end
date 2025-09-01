// File: lib/context/ScrollSelectPanels/AssetSelectProvider.tsx
'use client';

import React, { ReactNode, useState, useCallback, useMemo, useEffect, useRef } from 'react';

import { AssetSelectContext } from './useAssetSelectContext';
import { SP_COIN_DISPLAY, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import { dumpFSMContext, dumpInputFeedContext } from '@/lib/hooks/inputValidations/utils/debugContextDump';
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import { AssetSelectBag, isTokenSelectBag } from '@/lib/context/structure/types/panelBag';
import { useAssetSelectDisplay } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { useLatestRef } from '@/lib/hooks/useLatestRef';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const feedType = FEED_TYPE.TOKEN_LIST;
const DBG =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';
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
  const instanceId = useMemo(() => {
    switch (containerType) {
      case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:  return 'buy';
      case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL: return 'sell';
      default:                                        return 'main';
    }
  }, [containerType]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [validatedAsset, setValidatedAssetRaw] = useState<WalletAccount | TokenContract | undefined>();
  const [manualEntry, setManualEntry] = useState(false);
  const [panelBag, setPanelBag] = useState<AssetSelectBag>(
    initialPanelBag ?? ({ type: containerType } as AssetSelectBag)
  );

  const manualEntryRef = useLatestRef(manualEntry);
  const parentRef = useLatestRef({ closePanelCallback, setTradingTokenCallback });

  const setValidatedAsset = useCallback(
    (next?: WalletAccount | TokenContract) => {
      const prev = validatedAsset as TokenContract | undefined;
      const nxt  = next as TokenContract | undefined;
      if (prev?.address === nxt?.address && prev?.symbol === nxt?.symbol) return;
      setValidatedAssetRaw(next);
    },
    [validatedAsset]
  );

  const peerAddress = isTokenSelectBag(panelBag) ? panelBag.peerAddress : undefined;

  const fireSetTradingToken = useCallback(
    (asset: TokenContract | WalletAccount) => {
      try {
        parentRef.current.setTradingTokenCallback(asset);
      } catch (e) {
        debug.error?.(`[${instanceId}] setTradingTokenCallback failed`, e);
      }
    },
    [parentRef, instanceId]
  );

  const fireClosePanel = useCallback(
    (fromUser: boolean) => {
      try {
        parentRef.current.closePanelCallback(fromUser);
      } catch (e) {
        debug.error?.(`[${instanceId}] closePanelCallback failed`, e);
      }
    },
    [parentRef, instanceId]
  );

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

  const { resetPreview, showErrorPreview, showAssetPreview } = useAssetSelectDisplay();

  // StrictMode / double-render guard for terminal transitions
  const didHandleTerminalRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (inputState === InputState.UPDATE_VALIDATED_ASSET) {
      if (didHandleTerminalRef.current) return;
      didHandleTerminalRef.current = true;

      if (!validatedAsset) {
        debug.warn?.(`[${instanceId}] UPDATE_VALIDATED_ASSET with no validatedAsset`);
      } else {
        fireSetTradingToken(validatedAsset);
      }
      setInputState(InputState.CLOSE_SELECT_PANEL, `Provider(${instanceId}) commit → close`);
      return;
    }

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!didHandleTerminalRef.current) {
        // Arrived here without passing UPDATE_VALIDATED_ASSET
        debug.warn?.(
          `[${instanceId}] CLOSE_SELECT_PANEL reached before provider commit (asset=${String(!!validatedAsset)})`
        );
      }
      try {
        fireClosePanel(true);
      } finally {
        resetPreview();
        setValidatedAssetRaw(undefined);
        resetHexInput();
        setManualEntry(false);
        didHandleTerminalRef.current = false;
        if (isMountedRef.current) {
          setInputState(InputState.EMPTY_INPUT, `Provider(${instanceId}) closed`);
        }
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
    resetPreview,
  ]);

  // Minimal UI bridge
  useEffect(() => {
    switch (inputState) {
      case InputState.EMPTY_INPUT:
        resetPreview();
        break;
      case InputState.RESOLVE_ASSET:
        if (validatedAsset) showAssetPreview();
        break;
      case InputState.TOKEN_NOT_RESOLVED_ERROR:
      case InputState.RESOLVE_ASSET_ERROR:
        showErrorPreview();
        break;
      default:
        break;
    }
  }, [inputState, validatedAsset, resetPreview, showAssetPreview, showErrorPreview]);

  // Optional dumps (behind env flags)
  const dumpInputFeed = useCallback(
    (header?: string) => {
      if (!DBG) return;
      dumpInputFeedContext(
        header ?? '',
        validHexInput,
        debouncedHexInput,
        failedHexInput,
        failedHexCount,
        isValid,
        instanceId
      );
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

  // Token-only narrowers
  const validatedAssetNarrow = validatedAsset as TokenContract | undefined;
  const setValidatedAssetNarrow = useCallback(
    (t?: TokenContract) => setValidatedAsset(t),
    [setValidatedAsset]
  );

  const contextValue = useMemo(
    () => ({
      inputState,
      setInputState,

      validatedAsset: validatedAssetNarrow,
      setValidatedAsset: setValidatedAssetNarrow,

      manualEntry,
      setManualEntry,

      setValidatedToken: (t?: TokenContract) => setValidatedAssetNarrow(t),
      setValidatedWallet: (_?: WalletAccount) => {},

      dumpFSMContext: (h?: string) =>
        dumpFSMContext(h ?? '', inputState, validatedAsset as TokenContract | undefined, instanceId),
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

      closePanelCallback: () => parentRef.current.closePanelCallback(true),
      setTradingTokenCallback: (a: TokenContract) => parentRef.current.setTradingTokenCallback(a),

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
      dumpInputFeed,
      dumpAssetSelect,
      panelBag,
      showErrorPreview,
      showAssetPreview,
      resetPreview,
      parentRef,
      instanceId,
    ]
  );

  return <AssetSelectContext.Provider value={contextValue}>{children}</AssetSelectContext.Provider>;
};

export default AssetSelectProvider;
