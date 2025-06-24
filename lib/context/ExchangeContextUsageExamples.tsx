'use client';

import React from 'react';
import {
  useSellAmount,
  useBuyAmount,
  useSellTokenContract,
  useBuyTokenContract,
  useTradeDirection,
  useSlippage,
  useErrorMessage,
  useApiErrorMessage,
  useSpCoinDisplay,
  useTradeData,
  useSellTokenAddress,
  useBuyTokenAddress,
} from './hooks';

import { TRADE_DIRECTION, STATUS } from '@/lib/structure';

export default function ExchangeContextUsageExamples() {
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage, setSlippage, setBps } = useSlippage();
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const tradeData = useTradeData();
  const sellTokenAddress = useSellTokenAddress();
  const buyTokenAddress = useBuyTokenAddress();

  return (
      <div className="font-mono p-4">
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
      <pre>spCoinDisplay: {spCoinDisplay}</pre>
      <pre>Trade Data: {JSON.stringify(tradeData, null, 2)}</pre>
      <pre>Error Message: {JSON.stringify(errorMessage)}</pre>
      <pre>API Error Message: {JSON.stringify(apiErrorMessage)}</pre>

      <hr className="my-4" />

      <button onClick={() => setSellAmount(sellAmount + 1n)}>+1 Sell</button>
      <button onClick={() => setBuyAmount(buyAmount + 1n)}>+1 Buy</button>

      <button
        onClick={() =>
          setSellTokenContract({
            address: '0x111',
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
            address: '0x222',
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
    </div>
  );
}
