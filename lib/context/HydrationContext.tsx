'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { useExchangeContext } from './hooks/useExchangeContext';
import { createDebugLogger } from '../utils/debugLogger';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_HYDRATION === 'true';
const debugLog = createDebugLogger('HydrationContext', DEBUG);

type HydrationContextValue = {
  isHydrated: boolean;
};

const HydrationContext = createContext<HydrationContextValue>({ isHydrated: true }); // default to true for SSR safety

export const HydrationProvider = ({ children }: { children: React.ReactNode }) => {
  const { exchangeContext } = useExchangeContext();
  const contextChainId = exchangeContext.network?.chainId;
  const chainId = useChainId();
  const { status } = useAccount(); // 'connecting' | 'connected' | 'disconnected'

  const initialRender = useRef(true);
  const prevStatusRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  const isHydrated = status === 'connected' && chainId === contextChainId;

  useEffect(() => {
    if (initialRender.current) {
      debugLog.log(`🔄 Initial render: status=${status}`);
      initialRender.current = false;
    }

    if (status !== prevStatusRef.current) {
      debugLog.log(`🔔 Wagmi status changed: ${prevStatusRef.current} → ${status}`);
      prevStatusRef.current = status;
    }

    debugLog.log(
      `🧩 useEffect: status=${status}, wagmiChainId=${chainId}, contextChainId=${contextChainId}`
    );

    if (status !== 'connected') {
      debugLog.log(`⏳ Waiting for wallet connection...`);
      return;
    }

    if (chainId && contextChainId) {
      if (chainId === contextChainId) {
        debugLog.log(`✅ Chain ID match → ${chainId}`);
        hydratedRef.current = true;
      } else {
        debugLog.log(`⚠️ Chain mismatch → wagmi=${chainId}, context=${contextChainId}`);
      }
    } else {
      debugLog.log(`❌ Missing chainId → wagmi=${chainId}, context=${contextChainId}`);
    }
  }, [status, chainId, contextChainId]);

  return (
    <HydrationContext.Provider value={{ isHydrated }}>
      {children}
    </HydrationContext.Provider>
  );
};

export const useIsHydrated = (): boolean => {
  const context = useContext(HydrationContext);
  return context.isHydrated;
};
