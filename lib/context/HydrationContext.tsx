// File: lib/context/HydrationContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { useExchangeContext } from './hooks/useExchangeContext';
import { createDebugLogger } from '../utils/debugLogger';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_HYDRATION === 'true';
const debugLog = createDebugLogger('HydrationContext', DEBUG);

type HydrationContextValue = {
  hydratingFromLocal: boolean;
  setHydratingFromLocal: (v: boolean) => void;
};

const HydrationContext = createContext<HydrationContextValue | undefined>(undefined);

export const HydrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [hydratingFromLocal, setHydratingFromLocal] = useState(true);
  const { exchangeContext } = useExchangeContext();
  const contextChainId = exchangeContext.network?.chainId;
  const chainId = useChainId();
  const { status } = useAccount(); // 'connecting' | 'connected' | 'disconnected'

  const initialRender = useRef(true);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialRender.current) {
      debugLog.log(`🔄 Page load → Wagmi status: ${status}`);
      initialRender.current = false;
    }

    if (status !== prevStatusRef.current) {
      debugLog.log(`🔔 Wagmi status changed → ${prevStatusRef.current} → ${status}`);
      prevStatusRef.current = status;
    }

    debugLog.log(
      `🔁 useEffect triggered → hydrating=${hydratingFromLocal}, status=${status}, wagmiChainId=${chainId}, contextChainId=${contextChainId}`
    );

    if (!hydratingFromLocal) {
      debugLog.log(`✅ Already hydrated → skipping`);
      return;
    }

    if (status !== 'connected') {
      debugLog.log(`⏳ Waiting for wagmi to finish connecting... status=${status}`);
      return;
    }

    if (chainId && contextChainId) {
      if (chainId === contextChainId) {
        debugLog.log(`🎯 Chain match → chainId=${chainId}`);
        setHydratingFromLocal(false);
        debugLog.log(`🏁 Hydration complete → hydratingFromLocal set to false`);
      } else {
        debugLog.log(`🕒 Waiting for correct match → wagmi=${chainId}, context=${contextChainId}`);
      }
    } else {
      debugLog.log(`⛔ Missing chainId → wagmi=${chainId}, context=${contextChainId}`);
    }
  }, [status, chainId, contextChainId, hydratingFromLocal]);

  return (
    <HydrationContext.Provider value={{ hydratingFromLocal, setHydratingFromLocal }}>
      {children}
    </HydrationContext.Provider>
  );
};

export const useHydratingFromLocal = (): HydrationContextValue => {
  const ctx = useContext(HydrationContext);
  if (!ctx) throw new Error('useHydratingFromLocal must be used within a HydrationProvider');
  return ctx;
};
