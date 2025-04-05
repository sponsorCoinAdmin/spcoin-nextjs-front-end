'use client'

import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { useChainId } from 'wagmi'
import { saveExchangeContext } from '@/lib/context/ExchangeHelpers'

import {
  ExchangeContext as ExchangeContextTypeOnly,
  TRADE_DIRECTION,
  TokenContract,
  ErrorMessage,
  WalletAccount, // ✅ needed for recipientWallet
} from '@/lib/structure/types'

import {
  getInitialContext,
  loadStoredExchangeContext,
  sanitizeExchangeContext,
} from '@/lib/context/ExchangeHelpers'

export type ExchangeContextType = {
  exchangeContext: ExchangeContextTypeOnly
  setExchangeContext: (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => void
  setSellAmount: (amount: bigint) => void
  setBuyAmount: (amount: bigint) => void
  setSellTokenContract: (contract: TokenContract | undefined) => void
  setBuyTokenContract: (contract: TokenContract | undefined) => void
  setTradeDirection: (type: TRADE_DIRECTION) => void
  setSlippageBps: (bps: number) => void
  setRecipientWallet: (wallet: WalletAccount | undefined) => void // ✅

  errorMessage: ErrorMessage | undefined
  setErrorMessage: (error: ErrorMessage | undefined) => void
  apiErrorMessage: ErrorMessage | undefined
  setApiErrorMessage: (error: ErrorMessage | undefined) => void
}

export const ExchangeContextState = createContext<ExchangeContextType | null>(null)

export function ExchangeWrapper({ children }: { children: ReactNode }) {
  const chainId = useChainId()

  const [exchangeContext, setExchangeContextInternal] = useState<ExchangeContextTypeOnly | null>(null)
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>()
  const [apiErrorMessage, setApiErrorMessage] = useState<ErrorMessage | undefined>()

  const setExchangeContext = (updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly) => {
    setExchangeContextInternal((prev) => {
      const updated = prev ? updater(prev) : prev
      if (updated) saveExchangeContext(updated) // ✅ persist on update
      return updated
    })
  }

  const setRecipientWallet = (wallet: WalletAccount | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      recipientWallet: wallet,
    }))
  }

  const setSellAmount = (amount: bigint) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        sellTokenContract: prev.tradeData.sellTokenContract
          ? { ...prev.tradeData.sellTokenContract, amount }
          : undefined,
      },
    }))
  }

  const setBuyAmount = (amount: bigint) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: {
        ...prev.tradeData,
        buyTokenContract: prev.tradeData.buyTokenContract
          ? { ...prev.tradeData.buyTokenContract, amount }
          : undefined,
      },
    }))
  }

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, sellTokenContract: contract },
    }))
  }

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, buyTokenContract: contract },
    }))
  }

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, transactionType: type },
    }))
  }

  const setSlippageBps = (bps: number) => {
    console.trace(`🕵️‍♂️ setSlippageBps called with`, bps)
    setExchangeContext((prev) => ({
      ...prev,
      tradeData: { ...prev.tradeData, slippageBps: bps },
    }))
  }

  useEffect(() => {
    if (!exchangeContext) {
      const chain = chainId ?? 1
      const stored = loadStoredExchangeContext()
      const initial = getInitialContext(chain)
      const sanitized = sanitizeExchangeContext(stored, chain)

      if (sanitized.tradeData.slippageBps !== 200) {
        console.warn('🧼 Initial slippageBps not 200!', sanitized.tradeData.slippageBps)
      }

      setExchangeContextInternal(sanitized)
    }
  }, [chainId, exchangeContext])

  if (!exchangeContext) return null

  return (
    <ExchangeContextState.Provider
      value={{
        exchangeContext,
        setExchangeContext,
        setSellAmount,
        setBuyAmount,
        setSellTokenContract,
        setBuyTokenContract,
        setTradeDirection,
        setSlippageBps,
        setRecipientWallet, // ✅ exposed
        errorMessage,
        setErrorMessage,
        apiErrorMessage,
        setApiErrorMessage,
      }}
    >
      {children}
    </ExchangeContextState.Provider>
  )
}
