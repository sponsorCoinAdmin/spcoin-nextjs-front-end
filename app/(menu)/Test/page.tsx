// File: app/(menu)/Exchange/Test/page.tsx
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
import FSMTracePanel from '@/components/debug/FSMTracePanel';

import { useExchangeContext } from '@/lib/context/hooks';
import { usePageState } from '@/lib/context/PageStateContext';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

import {
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  ExchangeContext,
} from '@/lib/structure';

function createEnumStringMap<T extends Record<string, string | number>>(
  enumObj: T,
  enumName: string
): Record<number, string> {
  const map: Record<number, string> = {};
  for (const [key, value] of Object.entries(enumObj)) {
    if (typeof value === 'number') {
      map[value] = `${enumName}.${key}`;
    }
  }
  return map;
}

function useDidHydrate(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function normalizeContextDisplay(ctx: ExchangeContext): any {
  const spCoinDisplayMap = createEnumStringMap(SP_COIN_DISPLAY, 'SP_COIN_DISPLAY');
  const tradeDirectionMap = createEnumStringMap(TRADE_DIRECTION, 'TRADE_DIRECTION');
  const apiProviderMap = createEnumStringMap(API_TRADING_PROVIDER, 'API_TRADING_PROVIDER');

  const settings = ctx.settings ?? {};
  const tradeData = ctx.tradeData ?? {};
  const active: any = settings.activeDisplay ?? SP_COIN_DISPLAY.DISPLAY_OFF;

  return {
    ...ctx,
    settings: {
      ...settings,
      activeDisplay: spCoinDisplayMap[active],
      apiTradingProvider: apiProviderMap[settings.apiTradingProvider ?? API_TRADING_PROVIDER.API_0X],
    },
    tradeData: {
      ...tradeData,
      tradeDirection: tradeDirectionMap[tradeData.tradeDirection ?? TRADE_DIRECTION.SELL_EXACT_OUT],
    },
  };
}

const buttonClasses =
  'px-4 py-2 text-sm font-medium text-[#5981F3] bg-[#243056] rounded transition-colors duration-150 hover:bg-[#5981F3] hover:text-[#243056]';

export default function TestPage() {
  const isHydrated = useDidHydrate();
  const { address } = useAccount();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { state, setState } = usePageState();

  const page = state.page?.exchangePage ?? {};
  const {
    showContext = false,
    showWallets = false,
    collapsedKeys = [],
    expandContext = false,
    showActiveDisplayPanel = false,
  } = page;

  const [showFSMTracePanel, setShowFSMTracePanel] = useState(false);

  const tokenAddress = exchangeContext?.tradeData?.sellTokenContract?.address;

  useEffect(() => {
    localStorage.setItem('PageStateContext', JSON.stringify(state));
  }, [state]);

  const updateExchangePage = (updates: Partial<typeof page>) => {
    setState((prev) => {
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
    const nextShow = !showContext;
    updateExchangePage({
      showContext: nextShow,
      showActiveDisplayPanel: nextShow,
      expandContext: false,
      showWallets: false,
    });
    setShowFSMTracePanel(false);
  };

  const toggleExpandCollapse = () => {
    const nextExpand = !expandContext;
    const nextKeys = nextExpand ? [] : getAllNestedKeys(exchangeContext);
    updateExchangePage({
      expandContext: nextExpand,
      collapsedKeys: nextKeys,
    });
  };

  const toggleWallets = () => {
    const nextShowWallets = !showWallets;
    updateExchangePage({
      showWallets: nextShowWallets,
      showContext: false,
      showActiveDisplayPanel: false,
      expandContext: false,
    });
    setShowFSMTracePanel(false);
  };

  const toggleFSMTrace = () => {
    const nextShow = !showFSMTracePanel;
    setShowFSMTracePanel(nextShow);
    updateExchangePage({
      showContext: false,
      showActiveDisplayPanel: false,
      expandContext: false,
      showWallets: false,
    });
  };

  const getAllNestedKeys = (obj: any): string[] => {
    let keys: string[] = [];
    if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([k, v]) => {
        keys.push(k);
        if (typeof v === 'object' && v !== null) {
          keys.push(...getAllNestedKeys(v));
        }
      });
    }
    return keys;
  };

  const logContext = () => {
    const ctx = stringifyBigInt(exchangeContext);
    console.log('📦 Log Context:', ctx);
  };

  return (
    <div className="space-y-6 p-6">
      {isHydrated && (
        <div className="flex flex-wrap gap-4">
          {!showFSMTracePanel && !showWallets && (
            <button onClick={toggleContext} className={buttonClasses}>
              {showContext ? 'Hide Context' : 'Show Context'}
            </button>
          )}

          {showContext && (
            <>
              <button onClick={toggleExpandCollapse} className={buttonClasses}>
                {expandContext ? 'Collapse Context' : 'Expand Context'}
              </button>
              <button onClick={logContext} className={buttonClasses}>
                Log Context
              </button>
            </>
          )}

          {showContext && showActiveDisplayPanel && (
            <select
              id="activeDisplaySelect"
              title="Select activeDisplay"
              aria-label="Select activeDisplay"
              value={exchangeContext.settings.activeDisplay}
              onChange={(e) => {
                const selected = Number(e.target.value);
                console.log('🔄 Changing activeDisplay →', selected);
                setExchangeContext((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    activeDisplay: selected,
                  },
                }));
              }}
              className={buttonClasses}
            >
              <option value={SP_COIN_DISPLAY.TRADING_STATION_PANEL}>TRADING_STATION_PANEL</option>
              <option value={SP_COIN_DISPLAY.MANAGE_SPONSORS_BUTTON}>MANAGE_SPONSORS_BUTTON</option>
              <option value={SP_COIN_DISPLAY.RECIPIENT_SCROLL_PANEL}>RECIPIENT_SCROLL_PANEL</option>
              <option value={SP_COIN_DISPLAY.ERROR_MESSAGE_PANEL}>ERROR_MESSAGE_PANEL</option>
              <option value={SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL}>SPONSOR_RATE_CONFIG_PANEL</option>
              <option value={SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL}>RECIPIENT_SELECT_PANEL</option>
              <option value={SP_COIN_DISPLAY.AGENT_SELECT_PANEL}>AGENT_SELECT_PANEL</option>
              <option value={SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL}>SELL_SELECT_SCROLL_PANEL</option>
              <option value={SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL}>BUY_SELECT_SCROLL_PANEL</option>
            </select>
          )}

          {!showContext && !showWallets && (
            <button onClick={toggleFSMTrace} className={buttonClasses}>
              {showFSMTracePanel ? 'Hide FSM Trace' : 'Show FSM Trace'}
            </button>
          )}

          {!showContext && !showFSMTracePanel && (
            <button onClick={toggleWallets} className={buttonClasses}>
              {showWallets ? 'Hide Test Wallets' : 'Show Test Wallets'}
            </button>
          )}
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

      {isHydrated && <FSMTracePanel visible={showFSMTracePanel} />}

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
