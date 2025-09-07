// File: lib/context/hooks/providers/useProviderSetters.ts

import type { TRADE_DIRECTION, TokenContract, WalletAccount } from '@/lib/structure';
import type { ExchangeContext as ExchangeContextTypeOnly } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_USE_PROVIDER_SETTERS === 'true';
const debugLog = createDebugLogger('useProviderSetters', DEBUG_ENABLED, LOG_TIME);

type SetExchange = (
  updater: (prev: ExchangeContextTypeOnly) => ExchangeContextTypeOnly,
  hookName?: string
) => void;

export function useProviderSetters(setExchangeContext: SetExchange) {
  const setRecipientAccount = (wallet: WalletAccount | undefined) => {
    debugLog.log(`🛠️ setRecipientAccount → ${wallet?.address ?? 'undefined'}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      p.accounts.recipientAccount = wallet;
      return p;
    }, 'setRecipientAccount');
  };

  const setSellAmount = (amount: bigint) => {
    debugLog.log(`🛠️ setSellAmount → ${amount}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      if (p.tradeData.sellTokenContract) p.tradeData.sellTokenContract.amount = amount;
      return p;
    }, 'setSellAmount');
  };

  const setBuyAmount = (amount: bigint) => {
    debugLog.log(`🛠️ setBuyAmount → ${amount}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      if (p.tradeData.buyTokenContract) p.tradeData.buyTokenContract.amount = amount;
      return p;
    }, 'setBuyAmount');
  };

  const setSellTokenContract = (contract: TokenContract | undefined) => {
    debugLog.log(`🛠️ setSellTokenContract → ${contract?.address ?? 'undefined'}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.sellTokenContract = contract;
      return p;
    }, 'setSellTokenContract');
  };

  const setBuyTokenContract = (contract: TokenContract | undefined) => {
    debugLog.log(`🛠️ setBuyTokenContract → ${contract?.address ?? 'undefined'}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.buyTokenContract = contract;
      return p;
    }, 'setBuyTokenContract');
  };

  const setTradeDirection = (type: TRADE_DIRECTION) => {
    debugLog.log(`🛠️ setTradeDirection → ${type}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.tradeDirection = type;
      return p;
    }, 'setTradeDirection');
  };

  const setSlippageBps = (bps: number) => {
    debugLog.log(`🛠️ setSlippageBps → ${bps}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      p.tradeData.slippage.bps = bps;
      return p;
    }, 'setSlippageBps');
  };

  const setAppChainId = (chainId: number) => {
    debugLog.log(`🛠️ setAppChainId → ${chainId}`);
    return setExchangeContext((p) => {
      p = structuredClone(p);
      p.network.appChainId = chainId;
      return p;
    }, 'setAppChainId');
  };

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
