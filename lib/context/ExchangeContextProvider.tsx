'use client';

import React, { createContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useChainId, useAccount } from 'wagmi';
import {
  saveExchangeContext,
  loadStoredExchangeContext,
  sanitizeExchangeContext,
} from '@/lib/context/ExchangeHelpers';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
} from '@/lib/structure';

import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeWrapper', DEBUG_ENABLED, LOG_TIME);

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => void;
  setSellAmount: (amount: bigint) => void;
  setBuyAmount: (amount: bigint) => void;
  setSellTokenContract: (contract: TokenContract | undefined) => void;
  setBuyTokenContract: (contract: TokenContract | undefined) => void;
  setTradeDirection: (type: TRADE_DIRECTION) => void;
  setSlippageBps: (bps: number) => void;
  setRecipientAccount: (wallet: WalletAccount | undefined) => void;
  errorMessage: ErrorMessage | undefined;
  setErrorMessage: (error: ErrorMessage | undefined) => void;
  apiErrorMessage: ErrorMessage | undefined;
  setApiErrorMessage: (error: ErrorMessage | undefined) => void;
};

export const ExchangeContextState = createContext<ExchangeContextType | null>(null);

export function ExchangeWrapper({ children }: { children: ReactNode }) {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | null>(null);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => {
    setContextState((prev) => {
      debugLog.log('🧪 setExchangeContext triggered');
      const updated = prev ? updater(structuredClone(prev)) : prev;
      if (updated) {
        debugLog.log('📦 Saving exchangeContext to localStorage...');
        saveExchangeContext(updated);
      }
      return updated;
    });
  };

  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.accounts.recipientAccount = wallet;
      return cloned;
    });
  };

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.sellTokenContract) {
        cloned.tradeData.sellTokenContract.amount = amount;
      }
      return cloned;
    });
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }
      return cloned;
    });
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.sellTokenContract = contract;
      return cloned;
    });
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.buyTokenContract = contract;
      return cloned;
    });
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.tradeDirection = type;
      return cloned;
    });
  };

  const setSlippageBps = (bps: number) => {
    debugLog.log('🧾 setSlippageBps:', bps);
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.slippage.bps = bps;
      return cloned;
    });
  };

  useEffect(() => {
    if (hasInitializedRef.current || contextState) return;

    hasInitializedRef.current = true;
    debugLog.log('🔁 Initializing ExchangeContext...');

    const init = async () => {
      const chain = chainId ?? 1;

      debugLog.log('🔍 Attempting to load from localStorage...');
      const stored = loadStoredExchangeContext();

      const sanitized = sanitizeExchangeContext(stored, chain);
      debugLog.log('🧼 Sanitized context:', sanitized);

      if (!sanitized.tradeData.slippage?.bps || sanitized.tradeData.slippage.bps <= 0) {
        debugLog.warn('⚠️ Invalid slippageBps — defaulting may be required.');
      }

      if (isConnected && address) {
        debugLog.log('🔌 Injecting connected account:', address);
        try {
          const res = await fetch(`/assets/accounts/${address}/wallet.json`);
          const metadata = res.ok ? await res.json() : null;

          sanitized.accounts.connectedAccount = metadata
            ? { ...metadata, address }
            : {
                address,
                type: 'ERC20_WALLET',
                name: '',
                symbol: '',
                website: '',
                status: 'Missing',
                description: `Account ${address} not registered on this site`,
                logoURL: '/public/assets/miscellaneous/SkullAndBones.png',
              };

          debugLog.log('✅ Connected account metadata:', sanitized.accounts.connectedAccount);
        } catch (err) {
          debugLog.error('⛔ Failed to load wallet.json:', err);
        }
      }

      setContextState(sanitized);
    };

    init();
  }, [chainId, contextState, address, isConnected]);

  if (!contextState) return null;

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: contextState,
        setExchangeContext,
        setSellAmount,
        setBuyAmount,
        setSellTokenContract,
        setBuyTokenContract,
        setTradeDirection,
        setSlippageBps,
        setRecipientAccount,
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {children}
    </ExchangeContextState.Provider>
  );
}
