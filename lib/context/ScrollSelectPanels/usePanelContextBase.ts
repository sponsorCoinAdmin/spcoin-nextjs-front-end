// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts

'use client';

import { useMemo, useState, useCallback } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { FEED_TYPE, SP_COIN_DISPLAY, InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { dumpFSMContext, dumpInputFeedContext } from '@/lib/hooks/inputValidations/utils/debugContextDump';
import type { SharedPanelContextType } from './useSharedPanelContext';
import type { TokenContract, WalletAccount } from '@/lib/structure';

const LOG_TIME = false;
const instanceId = 'base';

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: SP_COIN_DISPLAY,
  label: string,
  debugEnabled: boolean = false
): SharedPanelContextType {
  const debugLog = createDebugLogger(label, debugEnabled, LOG_TIME);

  const [inputState, setInputStateRaw] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAssetRaw] = useState<TokenContract | undefined>(undefined);
  const [manualEntry, setManualEntry] = useState<boolean>(true);

  const setInputState = useCallback((next: InputState) => {
    setInputStateRaw((prev) => {
      if (prev === next) {
        debugLog.log(`⏭️ Skipped setInputState → Already in ${next}`);
        return prev;
      }
      debugLog.log(`✳️ setInputState → ${next}`);
      return next;
    });
  }, []);

  const setValidatedAsset = useCallback((next: TokenContract | undefined) => {
    if (
      validatedAsset?.address === next?.address &&
      validatedAsset?.symbol === next?.symbol
    ) {
      debugLog.log(`⏭️ Skipped setValidatedAsset → Already ${next?.symbol || next?.address}`);
      return;
    }
    debugLog.log(
      next
        ? `✅ setValidatedAsset → ${next.symbol || next.address}`
        : '🧼 Cleared validated asset'
    );
    setValidatedAssetRaw(next);
  }, [validatedAsset]);

  const setValidatedToken = useCallback((token?: TokenContract) => {
    debugLog.log(`🪙 setValidatedToken called`);
    setValidatedAsset(token);
  }, [setValidatedAsset]);

  const setValidatedWallet = useCallback((_wallet?: WalletAccount) => {
    debugLog.warn(`⚠️ setValidatedWallet called in base panel → ignored`);
  }, []);

  const {
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
  } = useHexInput();

  const dumpInputFeed = (header?: string) => {
    dumpInputFeedContext(
      header ?? '',
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      instanceId
    );
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    debugLog.log(`🛠 dumpSharedPanelContext called${headerInfo ? ` → ${headerInfo}` : ''}`);
    console.group(`[Panel Context Dump] (${label})`);
    if (headerInfo) console.log(`📝 ${headerInfo}`);
    dumpFSMContext(headerInfo ?? '', inputState, validatedAsset, instanceId);
    dumpInputFeed(headerInfo ?? '');
    console.groupEnd();
  };

  return useMemo(() => ({
    inputState,
    setInputState,
    validatedAsset,
    setValidatedAsset,
    manualEntry,
    setManualEntry,
    setValidatedToken,
    setValidatedWallet,
    validHexInput,
    debouncedHexInput,
    failedHexInput,
    failedHexCount,
    isValid,
    isValidHexString,
    handleHexInputChange,
    resetHexInput,
    dumpInputFeedContext: dumpInputFeed,
    dumpSharedPanelContext,
    containerType,
    feedType,
    instanceId,
    closeCallback: () => debugLog.log('⚠️ closeCallback not set in base panel'),
    setTradingTokenCallback: () => debugLog.log('⚠️ setTradingTokenCallback not set in base panel'),
    dumpFSMContext: (header?: string) =>
      dumpFSMContext(header ?? '', inputState, validatedAsset, instanceId),
  }), [
    inputState,
    validatedAsset,
    manualEntry,
    setInputState,
    setValidatedAsset,
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
  ]);
}
