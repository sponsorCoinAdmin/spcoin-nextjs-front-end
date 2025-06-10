"use client";

import React, { createContext, useEffect, useRef, useState, ReactNode } from 'react';
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
import { HydrationProvider } from '@/lib/context/HydrationContext';
import { useDidHydrate } from '@/lib/hooks/useDidHydrate';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_WRAPPER === 'true';
const debugLog = createDebugLogger('ExchangeWrapper', DEBUG_ENABLED, LOG_TIME);

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
  const didHydrate = useDidHydrate();

  const setExchangeContext = (
    updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
    hookName = 'unknown'
  ) => {
    setContextState((prev) => {
      debugLog.log('🧪 setExchangeContext triggered by', hookName);

      const updated = prev ? updater(structuredClone(prev)) : prev;

      if (prev && updated) {
        const oldSerialized = serializeWithBigInt(prev);
        const newSerialized = serializeWithBigInt(updated);

        if (oldSerialized !== newSerialized) {
          debugLog.log(
            `📝 Context update detected:\nHook: ${hookName}\nCurrently Hydrating = ${!didHydrate}\nCHANGING:\nOLD: ${oldSerialized}\nNEW: ${newSerialized}`
          );
        }
      }

      if (updated) {
        if (!updated.tradeData.buyTokenContract) {
          const trace = new Error().stack?.split('\n')?.slice(2, 6).join('\n') ?? 'No stack';
          debugLog.warn(`🚨 buyTokenContract is MISSING in updated context!\n📍 Call stack:\n${trace}`);
        }

        updated.accounts = {
          signer: updated.accounts?.signer ?? undefined,
          connectedAccount: updated.accounts?.connectedAccount ?? undefined,
          sponsorAccount: updated.accounts?.sponsorAccount ?? undefined,
          recipientAccount: updated.accounts?.recipientAccount ?? undefined,
          agentAccount: updated.accounts?.agentAccount ?? undefined,
          sponsorAccounts: updated.accounts?.sponsorAccounts ?? [],
          recipientAccounts: updated.accounts?.recipientAccounts ?? [],
          agentAccounts: updated.accounts?.agentAccounts ?? [],
        };

        const serialized = serializeWithBigInt(updated);
        debugLog.log('📦 Saving exchangeContext to localStorage:', serialized);
        saveLocalExchangeContext(updated);
        debugLog.log('🔚 --- End of Context Dump ---');
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
    if (!didHydrate) {
      debugLog.log('⏳ Skipping hydration — waiting for first client render');
      return;
    }

    if (hasInitializedRef.current) {
      debugLog.warn('🛑 Already initialized — skipping context load');
      return;
    }

    hasInitializedRef.current = true;
    debugLog.log('🔁 Initializing ExchangeContext...');

    const init = async () => {
      const chain = chainId ?? 1;

      debugLog.log('🔍 Attempting to load from localStorage...');
      const stored = loadLocalExchangeContext();
      debugLog.log('📦 Re-loaded stored exchangeContext:', stored);

      const sanitized = sanitizeExchangeContext(stored, chain);
      debugLog.log('🧼 Sanitized context:', sanitized);

      if (!sanitized.tradeData.slippage?.bps || sanitized.tradeData.slippage.bps <= 0) {
        debugLog.warn('⚠️ Invalid slippageBps — defaulting may be required.');
      }

      if (!sanitized.tradeData.buyTokenContract) {
        const trace = new Error().stack?.split('\n')?.slice(2, 6).join('\n') ?? 'No stack';
        debugLog.warn(`🚨 buyTokenContract is MISSING during context hydration!\n📍 Call stack:\n${trace}`);
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

      debugLog.log('📥 Setting contextState with sanitized object:', sanitized);
      setContextState(sanitized);
    };

    init();
  }, [chainId, address, isConnected, didHydrate]);

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
      <HydrationProvider>
        {children}
      </HydrationProvider>
    </ExchangeContextState.Provider>
  );
}
