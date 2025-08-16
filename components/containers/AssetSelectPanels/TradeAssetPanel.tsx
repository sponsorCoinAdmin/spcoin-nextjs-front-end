// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { parseUnits, formatUnits } from 'viem';
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
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
} from '@/lib/structure';

import styles from '@/styles/Exchange.module.css';
import ManageSponsorsButton from '@/components/Buttons/ManageSponsorsButton';
import AddSponsorshipButton from '@/components/Buttons/AddSponsorshipButton';
import TokenSelectDropDown from '../AssetSelectDropDowns/TokenSelectDropDown';
import { TokenPanelProvider, useTokenPanelContext } from '@/lib/context/TokenPanelProviders';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TradeAssetPanel', DEBUG_ENABLED, false);

// 🔒 PRIVATE inner component, not exported
function TradeAssetPanelInner() {
  const [apiProvider] = useApiProvider();
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
    containerType,
  } = useTokenPanelContext();

  const tokenContract =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellTokenContract : buyTokenContract;

  const [inputValue, setInputValue] = useState<string>('0');
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

  useEffect(() => {
    debugLog.log('✅ Connected to TokenPanelContext', { localTokenContract, localAmount });
    debugLog.log('🔎 activeDisplay:', getActiveDisplayString(exchangeContext.settings.activeDisplay));
  }, []);

  useEffect(() => {
    if (tokenContract) {
      debugLog.log(`📦 Loaded tokenContract for ${SP_COIN_DISPLAY[containerType]}:`, tokenContract);
      setLocalTokenContract(tokenContract);
    }
  }, [tokenContract, setLocalTokenContract, containerType]);

  // Keep text input in sync with selected token + global amount
  useEffect(() => {
    if (!tokenContract) return;
    const currentAmount =
      containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellAmount : buyAmount;
    const formatted = formatUnits(currentAmount, tokenContract.decimals || 18);
    if (inputValue !== formatted) setInputValue(formatted);
  }, [sellAmount, buyAmount, tokenContract]);

  // --- ⛔️ Stop writing debounced value back into global amounts.
  // --- ✅ Use debounced value ONLY to trigger side-effects (quotes, validations, etc.)
  const lastDebouncedRef = useRef<bigint | null>(null);
  useEffect(() => {
    const debouncedForPanel =
      containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
        ? debouncedSellAmount
        : debouncedBuyAmount;

    const directionOk =
      (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL &&
        tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) ||
      (containerType === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL &&
        tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN);

    if (!directionOk) return;

    if (lastDebouncedRef.current === debouncedForPanel) return;
    lastDebouncedRef.current = debouncedForPanel;

    debugLog.log('🔔 Debounced amount ready (side-effects only)', {
      panel: SP_COIN_DISPLAY[containerType],
      tradeDirection,
      amount: debouncedForPanel?.toString?.(),
      token: tokenContract?.address,
    });

    // If you have a debounced channel in context or an event bus, update/emit here.
    // Example: setDebouncedHexInput?.(debouncedForPanel);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('spcoin:debouncedAmount', {
            detail: {
              amount: debouncedForPanel,
              containerType,
              tradeDirection,
              token: tokenContract?.address,
            },
          }),
        );
      } catch {
        // ignore if CustomEvent isn't available
      }
    }
  }, [
    debouncedSellAmount,
    debouncedBuyAmount,
    containerType,
    tradeDirection,
    tokenContract,
  ]);

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

      if (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
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
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
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
      containerType === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL);

  const toggleTokenConfig = useCallback(() => {
    if (spCoinDisplay === SP_COIN_DISPLAY.TOKEN_SCROLL_PANEL) {
      setSpCoinDisplay(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
    } else {
      setSpCoinDisplay(SP_COIN_DISPLAY.TOKEN_SCROLL_PANEL);
    }
    debugLog.log(`⚙️ Toggled token config → ${getActiveDisplayString(spCoinDisplay)}`);
  }, [spCoinDisplay, setSpCoinDisplay]);

  return (
    <div id="TradeAssetPanelInner" className={styles.tokenSelectContainer}>
      <input
        id="TokenSelectPanelInput"
        className={clsx(styles.priceInput, styles.withBottomRadius)}
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
        (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? (
          <ManageSponsorsButton tokenContract={tokenContract} />
        ) : (
          <AddSponsorshipButton />
        ))}
    </div>
  );
}

// ✅ EXPORTED component with built-in provider
export default function TradeAssetPanel({ containerType }: { containerType: SP_COIN_DISPLAY }) {
  return (
    <TokenPanelProvider containerType={containerType}>
      <TradeAssetPanelInner />
    </TokenPanelProvider>
  );
}

// 🔧 Helper function
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
