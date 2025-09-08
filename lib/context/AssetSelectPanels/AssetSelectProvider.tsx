// File: lib/context/AssetSelectPanels/AssetSelectProvider.tsx
'use client';

import React, {
  ReactNode,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from 'react';

import { AssetSelectContext } from './useAssetSelectContext';
import { SP_COIN_DISPLAY, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { InputState } from '@/lib/structure/assetSelection';
import {
  dumpFSMContext,
  dumpInputFeedContext,
} from '@/lib/hooks/inputValidations/utils/debugContextDump';
import { useFSMStateManager } from '@/lib/hooks/inputValidations/FSM_Core/useFSMStateManager';
import { AssetSelectBag, isTokenSelectBag } from '@/lib/context/structure/types/panelBag';
import { useAssetSelectDisplay } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { useLatestRef } from '@/lib/hooks/useLatestRef';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const LOG_LEVEL: 'info' | 'warn' | 'error' = 'info';
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_FSM === 'true';

const debugLog = createDebugLogger('AssetSelectProvider', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

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
      case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:
        return 'buy';
      case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL:
        return 'sell';
      case SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL:
        return 'recipient';
      default:
        return 'main';
    }
  }, [containerType]);

  // 🔁 feedType depends on which panel we're rendering
  const feedType = useMemo(
    () =>
      containerType === SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL
        ? FEED_TYPE.WALLET_LIST // 👈 recipient panel shows wallet/recipient list
        : FEED_TYPE.TOKEN_LIST, // 👈 token panels show token list
    [containerType]
  );

  // Mount / unmount trace
  useEffect(() => {
    debugLog.log?.(
      `🔧 mount: containerType=${SP_COIN_DISPLAY[containerType]} | feedType=${FEED_TYPE[feedType]} | initialPanelBag=${
        initialPanelBag ? JSON.stringify(initialPanelBag) : '—'
      } | DEBUG=${String(DEBUG_ENABLED)}`
    );
    return () => {
      debugLog.log?.(`🧹 unmount: instanceId=${instanceId}`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [validatedAsset, setValidatedAssetRaw] = useState<
    WalletAccount | TokenContract | undefined
  >();
  const [manualEntry, setManualEntry] = useState(false);
  const [panelBag, setPanelBagState] = useState<AssetSelectBag>(
    initialPanelBag ?? ({ type: containerType } as AssetSelectBag)
  );

  // Log panelBag changes
  const prevPanelBagRef = useRef<AssetSelectBag | undefined>(undefined);
  useEffect(() => {
    if (prevPanelBagRef.current !== panelBag) {
      debugLog.log?.(
        `🎒 panelBag: ${JSON.stringify(prevPanelBagRef.current)} → ${JSON.stringify(panelBag)}`
      );
      prevPanelBagRef.current = panelBag;
    }
  }, [panelBag]);

  // Wrap setter to always log updates (supports function or value)
  const setPanelBag: Dispatch<SetStateAction<AssetSelectBag>> = useCallback(
    (update) => {
      setPanelBagState((prev) => {
        const next = typeof update === 'function' ? (update as any)(prev) : update;
        debugLog.log?.(`🎒 setPanelBag(prev→next): ${JSON.stringify(prev)} → ${JSON.stringify(next)}`);
        return next;
      });
    },
    [setPanelBagState]
  );

  const manualEntryRef = useLatestRef(manualEntry);
  const parentRef = useLatestRef({ closePanelCallback, setTradingTokenCallback });

  const setValidatedAsset = useCallback(
    (next?: WalletAccount | TokenContract) => {
      const prev = validatedAsset as TokenContract | undefined;
      const nxt = next as TokenContract | undefined;
      if (prev?.address === nxt?.address && prev?.symbol === nxt?.symbol) return;
      debugLog.log?.(
        `✅ setValidatedAsset: ${prev ? `${prev.symbol}@${prev.address}` : '—'} → ${
          nxt ? `${nxt.symbol}@${nxt.address}` : '—'
        }`
      );
      setValidatedAssetRaw(next);
    },
    [validatedAsset]
  );

  const peerAddress = isTokenSelectBag(panelBag) ? panelBag.peerAddress : undefined;

  const fireSetTradingToken = useCallback(
    (asset: TokenContract | WalletAccount) => {
      try {
        debugLog.log?.(
          `🚀 setTradingTokenCallback(asset=${
            asset && 'address' in (asset as any) ? (asset as any).address : 'wallet'
          })`
        );
        parentRef.current.setTradingTokenCallback(asset);
      } catch (e) {
        debugLog.error?.(`[${instanceId}] setTradingTokenCallback failed`, e);
      }
    },
    [parentRef, instanceId]
  );

  const fireClosePanel = useCallback(
    (fromUser: boolean) => {
      try {
        debugLog.log?.(`🚪 closePanelCallback(fromUser=${fromUser})`);
        parentRef.current.closePanelCallback(fromUser);
      } catch (e) {
        debugLog.error?.(`[${instanceId}] closePanelCallback failed`, e);
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
    feedType, // ✅ now dynamic
    instanceId,
    setValidatedAsset,
    closePanelCallback: fireClosePanel,
    setTradingTokenCallback: fireSetTradingToken,
    peerAddress,
    manualEntry: manualEntryRef.current,
  });

  // Log inputState transitions
  const prevStateRef = useRef<InputState | undefined>(undefined);
  useEffect(() => {
    if (prevStateRef.current !== inputState) {
      debugLog.log?.(
        `🔀 inputState: ${String(prevStateRef.current)} → ${String(inputState)} (manualEntry=${manualEntryRef.current})`
      );
      prevStateRef.current = inputState;
    }
  }, [inputState, manualEntryRef]);

  const { resetPreview, showErrorPreview, showAssetPreview } = useAssetSelectDisplay();

  // StrictMode / double-render guard for terminal transitions
  const didHandleTerminalRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (inputState === InputState.UPDATE_VALIDATED_ASSET) {
      if (didHandleTerminalRef.current) return;
      didHandleTerminalRef.current = true;

      if (!validatedAsset) {
        debugLog.warn?.(`[${instanceId}] UPDATE_VALIDATED_ASSET with no validatedAsset`);
      } else {
        debugLog.log?.(`[${instanceId}] ✅ committing validatedAsset → setTradingToken`);
        fireSetTradingToken(validatedAsset);
      }
      setInputState(InputState.CLOSE_SELECT_PANEL, `Provider(${instanceId}) commit → close`);
      return;
    }

    if (inputState === InputState.CLOSE_SELECT_PANEL) {
      if (!didHandleTerminalRef.current) {
        // Arrived here without passing UPDATE_VALIDATED_ASSET
        debugLog.warn?.(
          `[${instanceId}] CLOSE_SELECT_PANEL reached before provider commit (asset=${String(
            !!validatedAsset
          )})`
        );
      }
      try {
        fireClosePanel(true);
      } finally {
        debugLog.log?.(`[${instanceId}] ♻️ reset local state after close`);
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
        debugLog.log?.(`[${instanceId}] UI bridge → resetPreview()`);
        resetPreview();
        break;
      case InputState.RESOLVE_ASSET:
        if (validatedAsset) {
          debugLog.log?.(`[${instanceId}] UI bridge → showAssetPreview()`);
          showAssetPreview();
        }
        break;
      case InputState.TOKEN_NOT_RESOLVED_ERROR:
      case InputState.RESOLVE_ASSET_ERROR:
        debugLog.log?.(`[${instanceId}] UI bridge → showErrorPreview()`);
        showErrorPreview();
        break;
      default:
        break;
    }
  }, [inputState, validatedAsset, resetPreview, showAssetPreview, showErrorPreview, instanceId]);

  // Optional dumps (behind env flags)
  const dumpInputFeed = useCallback(
    (header?: string) => {
      if (!DEBUG_ENABLED) return;
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
      if (!DEBUG_ENABLED) return;
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
      feedType, // ✅ expose dynamic feedType

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
      setPanelBag,
    ]
  );
  return <AssetSelectContext.Provider value={contextValue}>{children}</AssetSelectContext.Provider>;
};

export default AssetSelectProvider;
