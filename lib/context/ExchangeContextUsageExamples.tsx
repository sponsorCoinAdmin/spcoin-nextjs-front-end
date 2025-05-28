// File: lib/context/ExchangeContextUsageExamples.tsx

'use client';

import React from 'react';
import {
  useSellAmount,
  useBuyAmount,
  useSellTokenContract,
  useBuyTokenContract,
  useTradeDirection,
  useContainerType,
  useSlippageBps,
  useErrorMessage,
  useApiErrorMessage,
  useSpCoinDisplay,
  useTradeData,
  useSellTokenAddress,
  useBuyTokenAddress,
} from './hooks/contextHooks';

import { TRADE_DIRECTION, CONTAINER_TYPE, STATUS } from '@/lib/structure/types';

export default function ExchangeContextUsageExamples() {
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const [containerType, setContainerType] = useContainerType();
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const tradeData = useTradeData();
  const sellTokenAddress = useSellTokenAddress();
  const buyTokenAddress = useBuyTokenAddress();

  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem' }}>
      <h2>🧪 Exchange Context Hook Tester</h2>
      <pre>Sell Amount: {sellAmount.toString()}</pre>
      <pre>Buy Amount: {buyAmount.toString()}</pre>
      <pre>Sell Token: {sellTokenContract?.symbol ?? 'None'}</pre>
      <pre>Buy Token: {buyTokenContract?.symbol ?? 'None'}</pre>
      <pre>Sell Token Address: {sellTokenAddress ?? 'None'}</pre>
      <pre>Buy Token Address: {buyTokenAddress ?? 'None'}</pre>
      <pre>Trade Direction: {tradeDirection}</pre>
      <pre>Container Type: {containerType}</pre>
      <pre>Slippage Bps: {slippageBps}</pre>
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

      <button onClick={() => setContainerType(CONTAINER_TYPE.SELL_SELECT_CONTAINER)}>
        Set Container Type: SELL_SELECT_CONTAINER
      </button>

      <button onClick={() => setSlippageBps(slippageBps + 10)}>
        Increase Slippage
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
