// File: lib/context/HydrationContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useChainId } from 'wagmi';
import { useExchangeContext } from './hooks/useExchangeContext';
import { createDebugLogger } from '../utils/debugLogger';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_HYDRATION === 'true';
const debugLog = createDebugLogger('HydrationContext', DEBUG);

const HydrationContext = createContext<boolean>(true);

export const HydrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [hydratingFromLocal, setHydratingFromLocal] = useState(true);
  const { exchangeContext } = useExchangeContext();
  const contextChainId = exchangeContext.network?.chainId;
  const chainId = useChainId();
  const initialRender = useRef(true);

  useEffect(() => {
    debugLog.log(
      `🔁 useEffect triggered → hydrating=${hydratingFromLocal}, wagmiChainId=${chainId}, contextChainId=${contextChainId}`
    );

    if (!hydratingFromLocal) {
      debugLog.log(`✅ Already hydrated → skipping`);
      return;
    }

    if (typeof window === 'undefined') {
      debugLog.log(`❌ Not in browser → aborting`);
      return;
    }

    if (chainId && contextChainId) {
      if (chainId !== 1 && chainId === contextChainId) {
        debugLog.log(
          `🎯 Match found → chainId=${chainId} === contextChainId=${contextChainId}`
        );
        setHydratingFromLocal(false);
        debugLog.log(`🏁 Hydration complete → hydratingFromLocal set to false`);
      } else {
        debugLog.log(
          `🕒 Waiting for correct match → wagmi=${chainId}, context=${contextChainId}`
        );
      }
    } else {
      debugLog.log(`⛔ chainId or contextChainId is missing → wagmi=${chainId}, context=${contextChainId}`);
    }

    if (initialRender.current) {
      debugLog.log(`🧪 First render triggered`);
      initialRender.current = false;
    }
  }, [chainId, contextChainId, hydratingFromLocal]);

  return (
    <HydrationContext.Provider value={hydratingFromLocal}>
      {children}
    </HydrationContext.Provider>
  );
};

export const useHydratingFromLocal = () => useContext(HydrationContext);
