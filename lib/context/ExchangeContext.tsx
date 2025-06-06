'use client';

import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { saveExchangeContext } from '@/lib/context/ExchangeHelpers';

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount,
} from '@/lib/structure';

import {
  loadStoredExchangeContext,
  sanitizeExchangeContext,
} from '@/lib/context/ExchangeHelpers';

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

  const setExchangeContext = (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => {
    setContextState((prev) => {
      const updated = prev ? updater(prev) : prev;
      if (updated) saveExchangeContext(updated);
      return updated;
    });
  };

  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        recipientAccount: wallet,
      },
    }));
  };

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: prev.tradeData.sellTokenContract
          ? { ...prev.tradeData.sellTokenContract, amount }
          : undefined,
      },
    }));
  };

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: prev.tradeData.buyTokenContract
          ? { ...prev.tradeData.buyTokenContract, amount }
          : undefined,
      },
    }));
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, sellTokenContract: contract },
    }));
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, buyTokenContract: contract },
    }));
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, tradeDirection: type },
    }));
  };

  const setSlippageBps = (bps: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.trace(`🕵️‍♂️ setSlippageBps called with`, bps);
    }
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, slippageBps: bps },
    }));
  };

  useEffect(() => {
    if (contextState) return;

    const init = async () => {
      const chain = chainId ?? 1;
      const stored = loadStoredExchangeContext();
      const sanitized = sanitizeExchangeContext(stored, chain);

      if (!sanitized.tradeData.slippageBps || sanitized.tradeData.slippageBps <= 0) {
        console.warn('⚠️ No valid slippageBps set — defaulting may be required.', sanitized.tradeData.slippageBps);
      }

      // Inject connected account if available
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
          console.error('⚠️ Failed to load wallet.json:', err);
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
