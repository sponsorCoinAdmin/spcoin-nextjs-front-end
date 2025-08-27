// File: lib/context/hooks/providers/useProviderSetters.ts

import type { TRADE_DIRECTION, TokenContract, WalletAccount } from '@/lib/structure';
import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

export function useProviderSetters(setExchangeContext: SetExchange) {
  const setRecipientAccount = (wallet: WalletAccount | undefined) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      p.accounts.recipientAccount = wallet;
      return p;
    }, 'setRecipientAccount');

  const setSellAmount = (amount: bigint) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      if (p.tradeData.sellTokenContract) p.tradeData.sellTokenContract.amount = amount;
      return p;
    }, 'setSellAmount');

  const setBuyAmount = (amount: bigint) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      if (p.tradeData.buyTokenContract) p.tradeData.buyTokenContract.amount = amount;
      return p;
    }, 'setBuyAmount');

  const setSellTokenContract = (contract: TokenContract | undefined) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.sellTokenContract = contract;
      return p;
    }, 'setSellTokenContract');

  const setBuyTokenContract = (contract: TokenContract | undefined) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.buyTokenContract = contract;
      return p;
    }, 'setBuyTokenContract');

  const setTradeDirection = (type: TRADE_DIRECTION) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.tradeDirection = type;
      return p;
    }, 'setTradeDirection');

  const setSlippageBps = (bps: number) =>
    setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.slippage.bps = bps;
      return p;
    }, 'setSlippageBps');

  return {
    setRecipientAccount,
    setSellAmount,
    setBuyAmount,
    setSellTokenContract,
    setBuyTokenContract,
    setTradeDirection,
    setSlippageBps,
  };
}
