// File: @/components/Buttons/ExchangeButton.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import styles from '@/styles/Exchange.module.css';
import {
  useBuyAmount,
  useErrorMessage,
  useSellAmount,
  useTradeData,
} from '@/lib/context/hooks';
import { BUTTON_TYPE, STATUS, TRADE_DIRECTION } from '@/lib/structure';
import swap from '@/lib/spCoin/swap';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_BUTTON === 'true';
const debugLog = createDebugLogger('ExchangeButton', DEBUG_ENABLED, LOG_TIME);

type Props = {
  isLoadingPrice: boolean;
};

const ExchangeButton = ({ isLoadingPrice }: Props) => {
  const tradeData = useTradeData();
  const [sellAmount] = useSellAmount();
  const [buyAmount] = useBuyAmount();
  const [errorMessage] = useErrorMessage();

  const tradeDirectionText = useMemo(
    () =>
      tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
        ? 'EXACT OUT '
        : 'EXACT IN ',
    [tradeData.tradeDirection]
  );

  const insufficientSellBalance = useMemo(() => {
    try {
      const bal = tradeData.sellTokenContract?.balance ?? 0n;
      const insufficient = bal < sellAmount;
      debugLog.log('Sell Balance Check', {
        tradeAmount: sellAmount,
        sellTradeBalance: bal,
        insufficient,
      });
      return insufficient;
    } catch (err: any) {
      debugLog.error('insufficientSellBalance Error', err?.message ?? err);
      return false;
    }
  }, [sellAmount, tradeData.sellTokenContract?.balance]);

  const tokensRequired = useMemo(
    () => !tradeData.sellTokenContract && !tradeData.buyTokenContract,
    [tradeData.sellTokenContract, tradeData.buyTokenContract]
  );
  const sellTokenRequired = useMemo(
    () => !tradeData.sellTokenContract,
    [tradeData.sellTokenContract]
  );
  const buyTokenRequired = useMemo(
    () => !tradeData.buyTokenContract,
    [tradeData.buyTokenContract]
  );
  const amountRequired = useMemo(
    () => sellAmount === 0n && buyAmount === 0n,
    [sellAmount, buyAmount]
  );

  const buttonType = useMemo<BUTTON_TYPE>(() => {
    const result =
      errorMessage?.status === STATUS.WARNING_HARDHAT
        ? BUTTON_TYPE.NO_HARDHAT_API
        : errorMessage?.status === STATUS.ERROR_API_PRICE
        ? BUTTON_TYPE.API_TRANSACTION_ERROR
        : isLoadingPrice
        ? BUTTON_TYPE.IS_LOADING_PRICE
        : tokensRequired
        ? BUTTON_TYPE.TOKENS_REQUIRED
        : sellTokenRequired
        ? BUTTON_TYPE.SELL_TOKEN_REQUIRED
        : buyTokenRequired
        ? BUTTON_TYPE.BUY_TOKEN_REQUIRED
        : amountRequired
        ? BUTTON_TYPE.ZERO_AMOUNT
        : insufficientSellBalance
        ? BUTTON_TYPE.INSUFFICIENT_BALANCE
        : BUTTON_TYPE.SWAP;

    debugLog.log(`ExchangeButton Resolved Button Type, ${BUTTON_TYPE[result]}`);
    return result;
  }, [
    errorMessage?.status,
    isLoadingPrice,
    tokensRequired,
    sellTokenRequired,
    buyTokenRequired,
    amountRequired,
    insufficientSellBalance,
  ]);

  const buttonText = useMemo(() => {
    switch (buttonType) {
      case BUTTON_TYPE.TOKENS_REQUIRED:
        return 'Select Trading Pair';
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
        return 'API Transaction Error';
      case BUTTON_TYPE.IS_LOADING_PRICE:
        return 'Fetching Best Price...';
      case BUTTON_TYPE.NO_HARDHAT_API:
        return 'No Hardhat API Provisioning..';
      case BUTTON_TYPE.ZERO_AMOUNT:
        return 'Enter an Amount';
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        return `Insufficient ${tradeData.sellTokenContract?.symbol ?? 'Token'} Balance`;
      case BUTTON_TYPE.SWAP:
        return `${tradeDirectionText} SWAP`;
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED:
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        return 'Sell Token Required';
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED:
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
        return 'Buy Token Required';
      default:
        return 'Button Type Undefined';
    }
  }, [buttonType, tradeDirectionText, tradeData.sellTokenContract?.symbol]);

  const colorKey = useMemo<'executeColor' | 'errorColor' | 'standardColor'>(() => {
    switch (buttonType) {
      case BUTTON_TYPE.SWAP:
        return 'executeColor';
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
      case BUTTON_TYPE.NO_HARDHAT_API:
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        return 'errorColor';
      default:
        return 'standardColor';
    }
  }, [buttonType]);

  const buttonClick = useCallback(async () => {
    debugLog.log(`Click Detected for ExchangeButton, ${BUTTON_TYPE[buttonType]}`);

    switch (buttonType) {
      case BUTTON_TYPE.TOKENS_REQUIRED:
        alert('Select Buy/Sell Tokens\nFrom The Drop Down Token List');
        return;
      case BUTTON_TYPE.API_TRANSACTION_ERROR:
        console.error(errorMessage?.msg ?? 'API Transaction Error');
        alert(errorMessage?.msg ?? 'API Transaction Error');
        return;
      case BUTTON_TYPE.ZERO_AMOUNT:
        alert('Enter An Amount');
        return;
      case BUTTON_TYPE.INSUFFICIENT_BALANCE:
        alert('Insufficient Sell Balance');
        return;
      case BUTTON_TYPE.NO_HARDHAT_API:
        alert('No HardHat API Provisioning');
        return;
      case BUTTON_TYPE.SWAP:
        debugLog.log('Initiating Swap');
        await swap();
        return;
      case BUTTON_TYPE.SELL_TOKEN_REQUIRED:
        alert('Please select Token to Sell (Required)');
        return;
      case BUTTON_TYPE.BUY_TOKEN_REQUIRED:
        alert('Please select Token to Buy (Required)');
        return;
      case BUTTON_TYPE.SELL_ERROR_REQUIRED:
        alert('Select Sell Tokens\nFrom The Drop Down Token List');
        return;
      case BUTTON_TYPE.BUY_ERROR_REQUIRED:
        alert('Select Buy Tokens\nFrom The Drop Down Token List');
        return;
      default:
        alert('Button Type Undefined');
        return;
    }
  }, [buttonType, errorMessage?.msg]);

  return (
    <div id="ExchangeButtonContext">
      <button
        id="ExchangeButton"
        onClick={buttonClick}
        type="button"
        className={`${styles.exchangeButton} ${styles[colorKey]}`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ExchangeButton;
