// File: components/Containers/TokenSelectPanel.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { useAccount } from 'wagmi';

import {
  useApiProvider,
  useSpCoinDisplay,
  useBuyAmount,
  useSellAmount,
  useSlippage,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
} from '@/lib/context/hooks';

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
import { clsx } from 'clsx';
import ManageSponsorsButton from '@/components/Buttons/ManageSponsorsButton';
import TokenSelectDropDown from '../AssetSelectDropDowns/TokenSelectDropDown';
import AddSponsorshipButton from '@/components/Buttons/AddSponsorshipButton';
import { useTokenPanelContext } from '@/lib/context/TradePanelProviders';

const LOG_TIMES = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TokenSelect', DEBUG_ENABLED, LOG_TIMES);

const TokenSelectPanel = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  const [apiProvider] = useApiProvider();
  const account = useAccount();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();
  const [spCoinDisplay] = useSpCoinDisplay();

  const {
    localTokenContract,
    setLocalTokenContract,
    localAmount,
    setLocalAmount,
    dumpContext,
  } = useTokenPanelContext();

  const tokenContract =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract
      : buyTokenContract;

  const [inputValue, setInputValue] = useState<string>('0');
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);


const tradePanelContext = useTokenPanelContext();

useEffect(() => {
  debugLog.log(`✅ [TokenSelectPanel] Connected to TokenPanelContext`, tradePanelContext);
}, []);

  useEffect(() => {
    if (!tokenContract) return;
    debugLog.log(`📦 tokenContract loaded for ${CONTAINER_TYPE[containerType]}:`, tokenContract);
    setLocalTokenContract(tokenContract); // mirror to local context
  }, [tokenContract, setLocalTokenContract]);

  useEffect(() => {
    if (!tokenContract) return;
    const currentAmount =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellAmount : buyAmount;
    const formatted = formatUnits(currentAmount, tokenContract.decimals || 18);
    if (inputValue !== formatted) setInputValue(formatted);
  }, [sellAmount, buyAmount, tokenContract]);

  useEffect(() => {
    if (
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
    ) {
      setSellAmount(debouncedSellAmount);
    }
    if (
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
    ) {
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
      setLocalAmount(bigIntValue); // mirror to local context
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

  debugLog.log(
    `💰 formattedBalance to display for ${tokenContract?.symbol || 'unknown'}:`,
    formattedBalance
  );

  const isInputDisabled =
    !tokenContract ||
    (apiProvider === API_TRADING_PROVIDER.API_0X &&
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER);

  const showNoRadius = () => {
    const isBuyTokenContainer = containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER;
    const isShowRecipient = spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER;
    return true;
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
            setInputValue(isNaN(parsed) ? '0' : parsed.toString());
          } catch {
            setInputValue('0');
          }
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
