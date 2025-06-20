'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import ReadWagmiERC20Fields from '@/components/ERC20/ReadWagmiERC20Fields';
import ReadWagmiERC20RecordFields from '@/components/ERC20/ReadWagmiERC20RecordFields';
import ReadWagmiERC20Records from '@/components/ERC20/ReadWagmiERC20Records';
import ReadWagmiERC20ContractFields from '@/components/ERC20/ReadWagmiERC20ContractFields';
import ReadWagmiERC20BalanceOf from '@/components/ERC20/ReadWagmiERC20BalanceOf';
import ReadWagmiERC20ContractName from '@/components/ERC20/ReadWagmiERC20ContractName';
import ReadWagmiERC20ContractSymbol from '@/components/ERC20/ReadWagmiERC20ContractSymbol';
import ReadWagmiERC20ContractDecimals from '@/components/ERC20/ReadWagmiERC20ContractDecimals';
import ReadWagmiERC20ContractTotalSupply from '@/components/ERC20/ReadWagmiERC20ContractTotalSupply';

import WalletsPage from '@/components/Pages/WalletsPage';
import JsonInspector from '@/components/shared/JsonInspector';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePageState } from '@/lib/context/PageStateContext';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

import {
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  ExchangeContext,
} from '@/lib/structure';

function useDidHydrate(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function normalizeContextDisplay(ctx: ExchangeContext): any {
  const spCoinDisplayMap = {
    [SP_COIN_DISPLAY.EXCHANGE_ROOT]: 'SP_COIN_DISPLAY.EXCHANGE_ROOT',
    [SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER]: 'SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER',
    [SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG]: 'SP_COIN_DISPLAY.SHOW_RECIPIENT_SELECT_DIALOG',
    [SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG]: 'SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG',
    [SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON]: 'SP_COIN_DISPLAY.SHOW_MANAGE_SPONSORS_BUTTON',
  };

  const tradeDirectionMap = {
    [TRADE_DIRECTION.SELL_EXACT_OUT]: 'TRADE_DIRECTION.SELL_EXACT_OUT',
    [TRADE_DIRECTION.BUY_EXACT_IN]: 'TRADE_DIRECTION.BUY_EXACT_IN',
  };

  const apiProviderMap = {
    [API_TRADING_PROVIDER.API_0X]: 'API_TRADING_PROVIDER.API_0X',
    [API_TRADING_PROVIDER.API_1INCH]: 'API_TRADING_PROVIDER.API_1INCH',
  };

  const settings = ctx.settings ?? {};
  const tradeData = ctx.tradeData ?? {};

  return {
    ...ctx,
    settings: {
      ...settings,
      spCoinDisplay: spCoinDisplayMap[settings.spCoinDisplay ?? SP_COIN_DISPLAY.EXCHANGE_ROOT],
      apiTradingProvider: apiProviderMap[settings.apiTradingProvider ?? API_TRADING_PROVIDER.API_0X],
    },
    tradeData: {
      ...tradeData,
      tradeDirection: tradeDirectionMap[tradeData.tradeDirection ?? TRADE_DIRECTION.SELL_EXACT_OUT],
    },
  };
}

export default function TestPage() {
  const isHydrated = useDidHydrate();
  const { address } = useAccount();
  const { exchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  const {
    showContext = false,
    showWallets = false,
    collapsedKeys = [],
    expandContext = false,
  } = state.page.exchangePage;

  const tokenAddress = exchangeContext?.tradeData?.sellTokenContract?.address;

  useEffect(() => {
    localStorage.setItem('PageStateContext', JSON.stringify(state));
  }, [state]);

  const updateExchangePage = (updates: Partial<typeof state.page.exchangePage>) => {
    setState(prev => {
      const newState = {
        ...prev,
        page: {
          ...prev.page,
          exchangePage: {
            ...prev.page.exchangePage,
            ...updates,
          },
        },
      };
      localStorage.setItem('PageStateContext', JSON.stringify(newState));
      return newState;
    });
  };

  const toggleContext = () => {
    if (!showContext) updateExchangePage({ showWallets: false });
    updateExchangePage({ showContext: !showContext });
  };

  const toggleWallets = () => {
    updateExchangePage({
      showWallets: !showWallets,
      showContext: showWallets ? showContext : false,
    });
  };

  const toggleExpandCollapse = () => {
    const nextExpand = !expandContext;
    const nextKeys = nextExpand ? [] : getAllKeys(exchangeContext);
    updateExchangePage({
      expandContext: nextExpand,
      collapsedKeys: nextKeys,
    });
  };

  const getAllKeys = (obj: any): string[] => {
    let keys: string[] = [];
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([k, v]) => {
        keys.push(k);
        if (typeof v === 'object' && v !== null) {
          keys.push(...getAllKeys(v));
        }
      });
    }
    return keys;
  };

  const logContext = () => {
    console.log('📦 Log Context:', stringifyBigInt(exchangeContext));
  };

  return (
    <div className="space-y-6 p-6">
      {isHydrated && (
        <div className="flex flex-wrap gap-4">
          <button onClick={toggleContext} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
            {showContext ? 'Hide Context' : 'Show Context'}
          </button>

          {showContext && (
            <button onClick={toggleExpandCollapse} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
              {expandContext ? 'Collapse Context' : 'Expand Context'}?
            </button>
          )}

          <button onClick={logContext} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
            Log Context
          </button>

          <button onClick={toggleWallets} className="px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded hover:text-green-500">
            {showWallets ? 'Hide Test Wallets' : 'Show Test Wallets'}
          </button>
        </div>
      )}

      {isHydrated && showContext && (
        <JsonInspector
          data={normalizeContextDisplay(exchangeContext)}
          collapsedKeys={collapsedKeys}
          updateCollapsedKeys={(next: string[]) => updateExchangePage({ collapsedKeys: next })}
        />
      )}

      {isHydrated && showWallets && (
        <div className="w-screen bg-[#1f2639] border border-gray-700 rounded-none shadow-inner p-4 m-0">
          <WalletsPage />
        </div>
      )}

      {isHydrated && tokenAddress && (
        <div className="grid gap-6">
          <ReadWagmiERC20Fields TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20RecordFields TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20Records TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractFields TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20BalanceOf TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractName TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractSymbol TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractDecimals TOKEN_CONTRACT_ADDRESS={tokenAddress} />
          <ReadWagmiERC20ContractTotalSupply TOKEN_CONTRACT_ADDRESS={tokenAddress} />
        </div>
      )}
    </div>
  );
}
