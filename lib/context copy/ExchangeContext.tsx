"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import {
  getInitialContext,
  saveExchangeContext,
  loadStoredExchangeContext,
} from "@/lib/context/ExchangeHelpers";
import { ExchangeContext } from "@/lib/structure/types";

// ✅ Define Context Type
type ExchangeContextType = {
  exchangeContext: ExchangeContext;
  setExchangeContext: (context: ExchangeContext) => void;
};

// ✅ Create Context
const ExchangeContextState = createContext<ExchangeContextType | null>(null);

// ✅ Provider Component
export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const [exchangeContext, setExchangeContext] = useState<ExchangeContext>(
    () => loadStoredExchangeContext() || getInitialContext(chainId)
  );

  useEffect(() => {
    const newContext = getInitialContext(chainId);
    setExchangeContext(newContext);
    saveExchangeContext(newContext);
  }, [chainId]);

  return (
    <ExchangeContextState.Provider value={{ exchangeContext, setExchangeContext }}>
      {children}
    </ExchangeContextState.Provider>
  );
}

// ✅ Hook to use Exchange Context
export const useExchangeContext = () => {
  const context = useContext(ExchangeContextState);
  if (!context) {
    throw new Error("useExchangeContext must be used within an ExchangeWrapper.");
  }
  return context;
};
