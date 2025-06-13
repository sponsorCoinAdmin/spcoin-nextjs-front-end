'use client';

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import {
  saveLocalExchangeContext,
  loadLocalExchangeContext,
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
import { serializeWithBigInt } from '../utils/jsonBigInt';

const LOG_TIME = false;
const LOG_LEVEL = 'info'; // 'info' | 'warn' | 'error'
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeWrapper', DEBUG_ENABLED, LOG_TIME, LOG_LEVEL);

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly;
  setExchangeContext: (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName?: string
  ) => void;
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

export function ExchangeWrapper({ children }: { children: React.ReactNode }) {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const [contextState, setContextState] = useState<ExchangeContextTypeOnly | undefined>();
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>();
  const hasInitializedRef = useRef(false);

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      debugLog.log('🧪 setExchangeContext triggered by', hookName);

      const updated = prev ? updater(structuredClone(prev)) : prev;

      if (prev && updated && updated.network?.chainId !== prev.network?.chainId) {
        debugLog.warn(
          `⚠️ network.chainId changed in setExchangeContext → ${prev.network?.chainId} ➝ ${updated.network?.chainId} 🔁 hook: ${hookName}`
        );
      }

      if (updated) {
        saveLocalExchangeContext(updated);
        debugLog.log('📦 exchangeContext saved to localStorage');
      }

      return updated;
    });
  };

  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.accounts.recipientAccount = wallet;
      return cloned;
    }, 'setRecipientAccount');
  };

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.sellTokenContract) {
        cloned.tradeData.sellTokenContract.amount = amount;
      }
      return cloned;
    }, 'setSellAmount');
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      if (cloned.tradeData.buyTokenContract) {
        cloned.tradeData.buyTokenContract.amount = amount;
      }
      return cloned;
    }, 'setBuyAmount');
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.sellTokenContract = contract;
      return cloned;
    }, 'setSellTokenContract');
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.buyTokenContract = contract;
      return cloned;
    }, 'setBuyTokenContract');
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.tradeDirection = type;
      return cloned;
    }, 'setTradeDirection');
  };

  const setSlippageBps = (bps: number) => {
    debugLog.log('🧾 setSlippageBps:', bps);
    setExchangeContext((prev) => {
      const cloned = structuredClone(prev);
      cloned.tradeData.slippage.bps = bps;
      return cloned;
    }, 'setSlippageBps');
  };

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    debugLog.log('🔁 Initializing ExchangeContext...');
    const init = async () => {
      const chain = chainId ?? 1;
      debugLog.log('🔍 Loading stored ExchangeContext...');

      const stored = loadLocalExchangeContext();
      debugLog.log(`🔗 Stored network.chainId = ${stored?.network?.chainId}`);

      const sanitized = sanitizeExchangeContext(stored, chain);
      debugLog.log(`🧪 sanitizeExchangeContext → network.chainId = ${sanitized.network?.chainId}`);
      debugLog.warn(`📥 Final network.chainId before hydration: ${sanitized.network?.chainId}`);

      if (isConnected && address) {
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
        } catch (err) {
          debugLog.error('⛔ Failed to load wallet.json:', err);
        }
      }

      setContextState(sanitized);
    };

    init();
  }, [chainId, address, isConnected]);

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext: {
          ...contextState,
          errorMessage,
          apiErrorMessage,
        } as ExchangeContextTypeOnly,
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
