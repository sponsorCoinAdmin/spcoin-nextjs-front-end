// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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

const maxInputSz = 28;

// Limit a numeric string to `max` display characters by trimming fractional digits first.
// If the integer part alone exceeds `max`, hard-truncate to `max`.
// Replace the old clampDisplay with this version
function clampDisplay(numStr: string, max = maxInputSz): string {
  if (!numStr) return '0';

  // No scientific notation expected from formatUnits; if present, hard cap.
  if (/[eE][+-]?\d+/.test(numStr)) return numStr.slice(0, max);

  let s = numStr;
  const neg = s.startsWith('-');
  const sign = neg ? '-' : '';
  if (neg) s = s.slice(1);

  let [intPart, fracPart = ''] = s.split('.');

  // If the sign + integer already fills/exceeds the limit, return the leftmost integer slice.
  const intLenWithSign = sign.length + intPart.length;
  if (intLenWithSign >= max) {
    // Keep as many leading integer digits as the cap allows (never include '.')
    const keep = max - sign.length;
    return sign + intPart.slice(0, Math.max(0, keep));
  }

  // Otherwise, we can try to include a '.' and some fractional digits.
  // Remaining space after placing sign + integer:
  let remaining = max - intLenWithSign;

  // We need at least 2 chars to show a fractional part: '.' + one digit
  if (fracPart && remaining > 1) {
    // space for fractional digits after the '.'
    const allowFrac = remaining - 1;
    const fracTrimmed = fracPart.slice(0, allowFrac);
    if (fracTrimmed.length > 0) {
      return sign + intPart + '.' + fracTrimmed;
    }
  }

  // Not enough room (or no fraction) → just the integer part.
  return sign + intPart;
}


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

  // Helper: treat ".", "123.", "123.0/00..." as mid-typing states
  const isIntermediateDecimal = (s: string): boolean =>
    s === '.' || /^\d+\.$/.test(s) || /^\d+\.\d*0$/.test(s);

  // ⌨️ Typing grace window to prevent racey mirror-overwrites while user edits quickly
  const TYPING_GRACE_MS = 550;
  const typingUntilRef = useRef<number>(0);

  // Keep text input in sync with selected token + global amount
  // but do NOT clobber while the user is typing or is in an intermediate decimal state.
  useEffect(() => {
    if (!tokenContract) return;
    if (isIntermediateDecimal(inputValue)) return;

    // still within the recent typing window? don't mirror
    if (Date.now() < typingUntilRef.current) return;

    const currentAmount =
      containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellAmount : buyAmount;
    const formattedRaw = formatUnits(currentAmount, tokenContract.decimals || 18);
    const formatted = clampDisplay(formattedRaw, maxInputSz);
    if (inputValue !== formatted) setInputValue(formatted);
  }, [sellAmount, buyAmount, tokenContract, containerType, inputValue]);

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
    // each keystroke opens a "do-not-mirror" window
    typingUntilRef.current = Date.now() + TYPING_GRACE_MS;

    // allow digits with at most one dot
    if (!/^\d*\.?\d*$/.test(value)) return;

    // keep leading zero before a dot (e.g., "0.") but trim other leading zeros
    const normalized = value.replace(/^0+(?!\.)/, '') || '0';

    debugLog.log(`⌨️ Input: ${value} → normalized: ${normalized}`);
    setInputValue(normalized);

    // ⛔ don't parse/push while user is mid-decimal
    if (isIntermediateDecimal(normalized)) return;

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
    if (spCoinDisplay === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
      setSpCoinDisplay(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
    } else {
      setSpCoinDisplay(SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL);
    }
    debugLog.log(`⚙️ Toggled token config → ${getActiveDisplayString(spCoinDisplay)}`);
  }, [spCoinDisplay, setSpCoinDisplay]);

  // 🔕 Stop browser autofill/suggestions without changing structure
  const noAutofillName = useMemo(
    () => `no-autofill-${Math.random().toString(36).slice(2)}`,
    []
  );

  return (
    <div id="TradeAssetPanelInner" className={styles.tokenSelectContainer}>
      <input
        id="TokenPanelInputAmount"
        className={clsx(styles.priceInput, styles.withBottomRadius)}
        placeholder="0"
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => {
          const parsed = parseFloat(inputValue);
          const str = isNaN(parsed) ? '0' : parsed.toString();
          setInputValue(clampDisplay(str, 10));
        }}
        name={noAutofillName}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="decimal"
        aria-autocomplete="none"
        data-lpignore="true"
        data-1p-ignore="true"
        data-form-type="other"
      />
      {/* Optional decoy to appease aggressive managers (invisible, harmless) */}
      <input
        type="text"
        autoComplete="new-password"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 h-0 w-0 pointer-events-none"
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
    const formattedRaw = formatUnits(amount, decimals);
    const formatted = clampDisplay(formattedRaw, 10);
    debugLog.log(`💰 formatted display amount for ${tokenContract.symbol}: ${formatted}`);
    return formatted;
  } catch {
    debugLog.warn(`⚠️ Failed to format amount with decimals:`, decimals);
    return '0.0';
  }
}
