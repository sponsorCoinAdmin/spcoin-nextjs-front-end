// File: lib/context/hooks/ExchangeContext/hooks/useProviderSetters.ts
import type { TRADE_DIRECTION, TokenContract, WalletAccount } from '@/lib/structure';
import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

export function useProviderSetters(setExchangeContext: SetExchange) {
  const setRecipientAccount = (wallet: WalletAccount | undefined) =>
    setExchangeContext((p) => {
      if (p.accounts.recipientAccount === wallet) return p;
      p = structuredClone(p);
      p.accounts.recipientAccount = wallet;
      return p;
    }, 'setRecipientAccount');

  const setSellAmount = (amount: bigint) =>
    setExchangeContext((p) => {
      const curr = p.tradeData.sellTokenContract?.amount;
      if (curr === amount) return p;
      p = structuredClone(p);
      if (p.tradeData.sellTokenContract) p.tradeData.sellTokenContract.amount = amount;
      return p;
    }, 'setSellAmount');

  const setBuyAmount = (amount: bigint) =>
    setExchangeContext((p) => {
      const curr = p.tradeData.buyTokenContract?.amount;
      if (curr === amount) return p;
      p = structuredClone(p);
      if (p.tradeData.buyTokenContract) p.tradeData.buyTokenContract.amount = amount;
      return p;
    }, 'setBuyAmount');

  const setSellTokenContract = (contract: TokenContract | undefined) =>
    setExchangeContext((p) => {
      const curr = p.tradeData.sellTokenContract;
      if (curr === contract || curr?.address === contract?.address) return p;
      p = structuredClone(p);
      p.tradeData.sellTokenContract = contract;
      return p;
    }, 'setSellTokenContract');

  const setBuyTokenContract = (contract: TokenContract | undefined) =>
    setExchangeContext((p) => {
      const curr = p.tradeData.buyTokenContract;
      if (curr === contract || curr?.address === contract?.address) return p;
      p = structuredClone(p);
      p.tradeData.buyTokenContract = contract;
      return p;
    }, 'setBuyTokenContract');

  const setTradeDirection = (type: TRADE_DIRECTION) =>
    setExchangeContext((p) => {
      if (p.tradeData.tradeDirection === type) return p;
      p = structuredClone(p);
      p.tradeData.tradeDirection = type;
      return p;
    }, 'setTradeDirection');

  const setSlippageBps = (bps: number) =>
    setExchangeContext((p) => {
      if (p.tradeData.slippage.bps === bps) return p;
      p = structuredClone(p);
      p.tradeData.slippage.bps = bps;
      return p;
    }, 'setSlippageBps');

  const setAppChainId = (chainId: number) =>
    setExchangeContext((p) => {
      if (p.network.appChainId === chainId) return p;
      p = structuredClone(p);
      p.network.appChainId = chainId;
      return p;
    }, 'setAppChainId');

  return {
    setRecipientAccount,
    setSellAmount,
    setBuyAmount,
    setSellTokenContract,
    setBuyTokenContract,
    setTradeDirection,
    setSlippageBps,
    setAppChainId,
  };
}
