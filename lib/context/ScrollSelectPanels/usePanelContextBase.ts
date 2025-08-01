// File: lib/context/ScrollSelectPanels/usePanelContextBase.ts

'use client';

import { useMemo } from 'react';
import { useHexInput } from '@/lib/hooks/useHexInput';
import { FEED_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import type { SharedPanelContextType } from './useSharedPanelContext';

const LOG_TIME = false;

export function usePanelContextBase(
  feedType: FEED_TYPE,
  containerType: SP_COIN_DISPLAY,
  label: string,
  debugEnabled: boolean = false
): SharedPanelContextType {
  const debugLog = createDebugLogger(label, debugEnabled, LOG_TIME);

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

  const dumpInputFeedContext = (headerInfo?: string) => {
    try {
      debugLog.log(`💬 dumpInputFeedContext called${headerInfo ? ` → ${headerInfo}` : ''}`);
      console.group(`[InputFeed Context Dump] (${label})`);
      if (headerInfo) console.log(`📝 ${headerInfo}`);
      console.log({
        validHexInput,
        debouncedHexInput,
        failedHexInput,
        failedHexCount,
        isValid,
      });
      console.groupEnd();
    } catch (err) {
      console.warn('⚠️ dumpInputFeedContext failed:', err);
    }
  };

  const dumpSharedPanelContext = (headerInfo?: string) => {
    try {
      debugLog.log(`🛠 dumpSharedPanelContext called${headerInfo ? ` → ${headerInfo}` : ''}`);
      console.group(`[Panel Context Dump] (${label})`);
      if (headerInfo) console.log(`📝 ${headerInfo}`);
      dumpInputFeedContext();
      console.groupEnd();
    } catch (err) {
      console.warn('⚠️ dumpSharedPanelContext failed:', err);
    }
  };

  return useMemo<Partial<SharedPanelContextType>>(
    () => ({
      validHexInput,
      debouncedHexInput,
      failedHexInput,
      failedHexCount,
      isValid,
      isValidHexString,
      handleHexInputChange,
      resetHexInput,
      dumpInputFeedContext,
      dumpSharedPanelContext,
      containerType,
      feedType,
    }),
    [
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
    ]
  );
}
