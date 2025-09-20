// File: lib/context/ExchangeContextUsageExamples.tsx

'use client';

import React, { useMemo } from 'react';
import {
  useSellAmount,
  useBuyAmount,
  useSellTokenContract,
  useBuyTokenContract,
  useTradeDirection,
  useSlippage,
  useErrorMessage,
  useApiErrorMessage,
  useTradeData,
  useSellTokenAddress,
  useBuyTokenAddress,
} from './hooks';

import { SP_COIN_DISPLAY, TRADE_DIRECTION, STATUS } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

export default function ExchangeContextUsageExamples() {
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage, setSlippage, setBps } = useSlippage();
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const tradeData = useTradeData();
  const sellTokenAddress = useSellTokenAddress();
  const buyTokenAddress = useBuyTokenAddress();

  // ⬇️ Updated panel-tree API
  const { isVisible, openPanel, activeMainOverlay, isTokenScrollVisible } = usePanelTree();

  // Prefer showing which token scroll is open; otherwise show the active main overlay label
  const activePanelLabel = useMemo(() => {
    if (isVisible(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST)) return 'SELL_SELECT_PANEL_LIST';
    if (isVisible(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST)) return 'BUY_SELECT_PANEL_LIST';
    return SP_COIN_DISPLAY[activeMainOverlay] ?? 'NONE';
  }, [isVisible, activeMainOverlay]);

  return (
    <div className="font-mono p-4 space-y-2">
      <h2>🧪 Exchange Context Hook Tester</h2>
      <pre>Sell Amount: {sellAmount.toString()}</pre>
      <pre>Buy Amount: {buyAmount.toString()}</pre>
      <pre>Sell Token: {sellTokenContract?.symbol ?? 'None'}</pre>
      <pre>Buy Token: {buyTokenContract?.symbol ?? 'None'}</pre>
      <pre>Sell Token Address: {sellTokenAddress ?? 'None'}</pre>
      <pre>Buy Token Address: {buyTokenAddress ?? 'None'}</pre>
      <pre>Trade Direction: {tradeDirection}</pre>
      <pre>Slippage Bps: {slippage.bps}</pre>
      <pre>Slippage Percentage: {slippage.percentage}</pre>
      <pre>Slippage Percentage String: {slippage.percentageString}</pre>

      <pre>Active Panel (panel-tree): {activePanelLabel}</pre>
      <pre>Token Scroll Visible: {isTokenScrollVisible ? 'yes' : 'no'}</pre>

      <pre>Trade Data: {JSON.stringify(tradeData, null, 2)}</pre>
      <pre>Error Message: {JSON.stringify(errorMessage)}</pre>
      <pre>API Error Message: {JSON.stringify(apiErrorMessage)}</pre>

      <hr className="my-4" />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSellAmount(sellAmount + 1n)}>+1 Sell</button>
        <button onClick={() => setBuyAmount(buyAmount + 1n)}>+1 Buy</button>

        <button
          onClick={() =>
            setSellTokenContract({
              address: '0x111' as any,
              symbol: 'ETH',
              name: 'Ethereum',
              decimals: 18,
              balance: 0n,
              amount: sellAmount,
              totalSupply: 100000000000000000000n,
              chainId: 1,
            })
          }
        >
          Set Sell Token (ETH)
        </button>

        <button
          onClick={() =>
            setBuyTokenContract({
              address: '0x222' as any,
              symbol: 'DAI',
              name: 'Dai Stablecoin',
              decimals: 18,
              balance: 0n,
              amount: buyAmount,
              totalSupply: 100000000000000000000n,
              chainId: 1,
            })
          }
        >
          Set Buy Token (DAI)
        </button>

        <button onClick={() => setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN)}>
          Set Trade Direction: BUY_EXACT_IN
        </button>

        <button onClick={() => setBps(slippage.bps + 10)}>Increase Slippage by 10bps</button>
        <button onClick={() => setBps(100)}>Set Bps to 100 (1%)</button>

        <button
          onClick={() =>
            setSlippage({
              bps: 200,
              percentage: 2.0,
              percentageString: '2.00%',
            })
          }
        >
          Set Slippage to 2.00%
        </button>

        <button
          onClick={() =>
            setSlippage({
              bps: 50,
              percentage: 0.5,
              percentageString: '0.50%',
            })
          }
        >
          Set Slippage to 0.50%
        </button>

        <button
          onClick={() =>
            setErrorMessage({
              errCode: 1,
              msg: 'Something broke',
              source: 'test',
              status: STATUS.FAILED,
            })
          }
        >
          Trigger Error
        </button>

        <button
          onClick={() =>
            setApiErrorMessage({
              errCode: 2,
              msg: 'API failure',
              source: 'api',
              status: STATUS.FAILED,
            })
          }
        >
          Trigger API Error
        </button>

        <button
          onClick={() => {
            setErrorMessage(undefined);
            setApiErrorMessage(undefined);
          }}
        >
          Clear Errors
        </button>

        {/* 🔧 Panel-tree test controls (new API) */}
        <button onClick={() => openPanel(SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST)}>
          Open SELL panel
        </button>
        <button onClick={() => openPanel(SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST)}>
          Open BUY panel
        </button>
        <button onClick={() => openPanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL_LIST)}>
          Open RECIPIENT panel
        </button>
        <button onClick={() => openPanel(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL)}>
          Open SPONSOR CONFIG
        </button>
        <button onClick={() => openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL)}>
          Close overlays (show Trading)
        </button>
      </div>
    </div>
  );
}
