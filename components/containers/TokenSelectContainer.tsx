'use client';

import React, { useEffect, useState } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';

import {
  useApiProvider,
  useSpCoinDisplay,
  useBuyAmount,
  useExchangeContext,
  useSellAmount,
  useSlippage,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';

import AddSponsorship from '../Buttons/AddSponsorshipButton';
import TokenSelectDropDown from './TokenSelectDropDown';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';

import { parseValidFormattedAmount, isSpCoin } from '@/lib/spCoin/coreUtils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import {
  CONTAINER_TYPE,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import styles from '@/styles/Exchange.module.css';
import { spCoinDisplayString } from '@/lib/spCoin/guiControl';
import { clsx } from 'clsx';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_SPCOIN_DISPLAY === 'true';
const debugLog = createDebugLogger('TokenSelect', DEBUG_ENABLED);

const TokenSelectContainer = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  const { exchangeContext } = useExchangeContext();
  const [apiProvider] = useApiProvider();
  const account = useAccount();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [spCoinDisplay] = useSpCoinDisplay();

  const tokenContract = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    ? sellTokenContract
    : buyTokenContract;

  const [inputValue, setInputValue] = useState<string>('0');
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

  useEffect(() => {
    if (!tokenContract) return;
    debugLog.log(`📦 tokenContract loaded for ${CONTAINER_TYPE[containerType]}:`, tokenContract);
  }, [tokenContract]);

  useEffect(() => {
    if (!tokenContract) return;

    const currentAmount = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellAmount : buyAmount;
    const formatted = formatUnits(currentAmount, tokenContract.decimals || 18);

    if (inputValue !== formatted) {
      setInputValue(formatted);
    }
  }, [sellAmount, buyAmount, tokenContract]);

  useEffect(() => {
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER && tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) {
      setSellAmount(debouncedSellAmount);
    }
    if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER && tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN) {
      setBuyAmount(debouncedBuyAmount);
    }
  }, [debouncedSellAmount, debouncedBuyAmount, containerType, tradeDirection]);

  const handleInputChange = (value: string) => {
    const isValid = /^\d*\.?\d*$/.test(value);
    if (!isValid) return;

    const normalized = value.replace(/^0+(?!\.)/, '') || '0';
    debugLog.log(`⌨️ User input: ${value} → normalized: ${normalized}`);
    setInputValue(normalized);

    if (!tokenContract) return;

    const decimals = tokenContract.decimals || 18;
    const formatted = parseValidFormattedAmount(normalized, decimals);

    try {
      const bigIntValue = parseUnits(formatted, decimals);
      debugLog.log(`🔢 Parsed BigInt: ${bigIntValue}`);

      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
        setSellAmount(bigIntValue);
      } else {
        setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN);
        setBuyAmount(bigIntValue);
      }
    } catch (err) {
      debugLog.warn('⚠️ Failed to parse input:', err);
    }
  };

  const buySellText = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    ? (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
        ? `You Pay ± ${slippage.percentageString}`
        : `You Exactly Pay:`)
    : (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
        ? `You Receive ± ${slippage.percentageString}`
        : `You Exactly Receive:`);

  const formattedBalance = tokenContract && tokenContract.balance !== undefined
    ? formatUnits(tokenContract.balance, tokenContract.decimals || 18)
    : '0.0';

  const isInputDisabled =
    !tokenContract ||
    (apiProvider === API_TRADING_PROVIDER.API_0X &&
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER);

  const showNoRadius = () => {
    const isBuyTokenContainer = containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER;
    const isShowRecipient = spCoinDisplay === SP_COIN_DISPLAY.SHOW_ACTIVE_RECIPIENT_CONTAINER;
    const isShowRateConfig = spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG;
    return isBuyTokenContainer && (isShowRecipient || isShowRateConfig);
  };

  return (
    <div className={clsx(styles.inputs, styles.tokenSelectContainer)}>
      <input
        className={clsx(
          styles.priceInput,
          showNoRadius() ? styles.noBottomRadius : styles.withBottomRadius
        )}
        placeholder="0"
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => {
          try {
            const parsed = parseFloat(inputValue);
            if (isNaN(parsed)) {
              setInputValue('0');
            } else {
              const normalized = parsed.toString();
              setInputValue(normalized);
            }
          } catch {
            setInputValue('0');
          }
        }}
      />
      <TokenSelectDropDown
        containerType={containerType}
        tokenContract={tokenContract}
        setDecimalAdjustedContract={
          containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
            ? setSellTokenContract
            : setBuyTokenContract
        }
      />
      <div className={styles.buySell}>{buySellText}</div>
      <div className={styles.assetBalance}>Balance: {formattedBalance}</div>
      {isSpCoin(tokenContract) &&
        (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? (
          <ManageSponsorsButton tokenContract={tokenContract} />
        ) : ( 
          <AddSponsorship />
        ))}
      <span>{DEBUG_ENABLED && spCoinDisplayString(spCoinDisplay)}</span>
    </div>
  );
};

export default TokenSelectContainer;
