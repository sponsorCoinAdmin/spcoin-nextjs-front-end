// File: components/containers/AssetSelectPanels/TokenSelectPanel.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { clsx } from 'clsx';

import {
  useApiProvider,
  useSpCoinDisplay,
  useBuyAmount,
  useSellAmount,
  useSlippage,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
  useExchangeContext,
} from '@/lib/context/hooks';

import { parseValidFormattedAmount, isSpCoin } from '@/lib/spCoin/coreUtils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { getActiveDisplayString } from '@/lib/context/helpers/activeDisplayHelpers';

import {
  CONTAINER_TYPE,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  SP_COIN_DISPLAY,
} from '@/lib/structure';

import styles from '@/styles/Exchange.module.css';
import ManageSponsorsButton from '@/components/Buttons/ManageSponsorsButton';
import AddSponsorshipButton from '@/components/Buttons/AddSponsorshipButton';
import TokenSelectDropDown from '../AssetSelectDropDowns/TokenSelectDropDown';
import { useTokenPanelContext } from '@/lib/context/TokenPanelProviders';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TokenSelectPanel', DEBUG_ENABLED, false);

const TokenSelectPanel = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  const [apiProvider] = useApiProvider();
  const account = useAccount();
  const { exchangeContext } = useExchangeContext();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  const {
    localTokenContract,
    setLocalTokenContract,
    localAmount,
    setLocalAmount,
    dumpTokenContext,
  } = useTokenPanelContext();

  const tokenContract =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellTokenContract : buyTokenContract;

  const [inputValue, setInputValue] = useState<string>('0');
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

  useEffect(() => {
    debugLog.log('✅ Connected to TokenPanelContext', { localTokenContract, localAmount });
    debugLog.log('🔎 activeDisplay:', getActiveDisplayString(exchangeContext.settings.activeDisplay));
  }, []);

  useEffect(() => {
    if (tokenContract) {
      debugLog.log(`📦 Loaded tokenContract for ${CONTAINER_TYPE[containerType]}:`, tokenContract);
      setLocalTokenContract(tokenContract);
    }
  }, [tokenContract, setLocalTokenContract]);

  useEffect(() => {
    if (tokenContract) {
      const currentAmount =
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellAmount : buyAmount;
      const formatted = formatUnits(currentAmount, tokenContract.decimals || 18);
      if (inputValue !== formatted) setInputValue(formatted);
    }
  }, [sellAmount, buyAmount, tokenContract]);

  useEffect(() => {
    if (
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
    ) {
      setSellAmount(debouncedSellAmount);
    } else if (
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
    ) {
      setBuyAmount(debouncedBuyAmount);
    }
  }, [debouncedSellAmount, debouncedBuyAmount, containerType, tradeDirection]);

  const handleInputChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    const normalized = value.replace(/^0+(?!\.)/, '') || '0';
    debugLog.log(`⌨️ Input: ${value} → normalized: ${normalized}`);
    setInputValue(normalized);

    if (!tokenContract) return;

    const decimals = tokenContract.decimals || 18;
    const formatted = parseValidFormattedAmount(normalized, decimals);

    try {
      const bigIntValue = parseUnits(formatted, decimals);
      debugLog.log(`🔢 Parsed BigInt: ${bigIntValue}`);
      setLocalAmount(bigIntValue);

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

  const buySellText =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
        ? `You Pay ± ${slippage.percentageString}`
        : `You Exactly Pay:`
      : tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
      ? `You Receive ± ${slippage.percentageString}`
      : `You Exactly Receive:`;

  const formattedBalance = useFormattedTokenAmount(tokenContract, tokenContract?.balance ?? 0n);

  const isInputDisabled =
    !tokenContract ||
    (apiProvider === API_TRADING_PROVIDER.API_0X &&
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER);

  const toggleTokenConfig = useCallback(() => {
    if (spCoinDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER) {
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG);
    } else {
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER);
    }
    debugLog.log(`⚙️ Toggled token config → ${getActiveDisplayString(spCoinDisplay)}`);
  }, [spCoinDisplay, setSpCoinDisplay]);

  return (
    <div className={clsx(styles.inputs, styles.tokenSelectContainer)}>
      <input
        className={clsx(
          styles.priceInput,
          styles.withBottomRadius // you can adjust radius logic here if needed
        )}
        placeholder="0"
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(inputValue);
          setInputValue(isNaN(parsed) ? '0' : parsed.toString());
        }}
      />
      <TokenSelectDropDown containerType={containerType} />
      <div className={styles.buySell}>{buySellText}</div>
      <div className={styles.assetBalance}>Balance: {formattedBalance}</div>

      {isSpCoin(tokenContract) &&
        (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? (
          <ManageSponsorsButton tokenContract={tokenContract} />
        ) : (
          <AddSponsorshipButton />
        ))}
    </div>
  );
};

function useFormattedTokenAmount(tokenContract: any, amount: bigint): string {
  const decimals = tokenContract?.decimals ?? 18;

  if (!tokenContract || tokenContract.balance === undefined) {
    debugLog.log(`💰 fallback: tokenContract or balance undefined for ${tokenContract?.symbol}`);
    return '0.0';
  }

  try {
    const formatted = formatUnits(amount, decimals);
    debugLog.log(`💰 formatted display amount for ${tokenContract.symbol}: ${formatted}`);
    return formatted;
  } catch {
    debugLog.warn(`⚠️ Failed to format amount with decimals:`, decimals);
    return '0.0';
  }
}

export default TokenSelectPanel;
