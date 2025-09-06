// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { parseUnits, formatUnits, Address } from 'viem';
import { clsx } from 'clsx';

import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { useContextBalance } from '@/lib/hooks/useContextBalance';

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

import {
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
} from '@/lib/structure';

import styles from '@/styles/Exchange.module.css';
import ManageSponsorsButton from '@/components/Buttons/ManageSponsorsButton';
import AddSponsorshipButton from '@/components/Buttons/AddSponsorshipButton';
import TokenSelectDropDown from '../AssetSelectDropDowns/TokenSelectDropDown';
import { TokenPanelProvider, useTokenPanelContext } from '@/lib/context/providers/Panels';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TradeAssetPanel', DEBUG_ENABLED, false);

const maxInputSz = 28;
const TYPING_GRACE_MS = 550;

function clampDisplay(numStr: string, max = maxInputSz): string {
  if (!numStr) return '0';
  if (/[eE][+-]?\d+/.test(numStr)) return numStr.slice(0, max);

  let s = numStr;
  const neg = s.startsWith('-');
  const sign = neg ? '-' : '';
  if (neg) s = s.slice(1);

  let [intPart, fracPart = ''] = s.split('.');
  const intLenWithSign = sign.length + intPart.length;

  if (intLenWithSign >= max) {
    const keep = max - sign.length;
    return sign + intPart.slice(0, Math.max(0, keep));
  }

  let remaining = max - intLenWithSign;
  if (fracPart && remaining > 1) {
    const allowFrac = remaining - 1;
    const fracTrimmed = fracPart.slice(0, allowFrac);
    if (fracTrimmed.length > 0) return sign + intPart + '.' + fracTrimmed;
  }
  return sign + intPart;
}

function lower(addr?: string | Address) {
  return addr ? (addr as string).toLowerCase() : '';
}

function TradeAssetPanelInner() {
  const [apiProvider] = useApiProvider();
  const { exchangeContext } = useExchangeContext();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();
  const [spCoinDisplay] = useSpCoinDisplay();

  const { setLocalTokenContract, setLocalAmount, containerType } = useTokenPanelContext();

  const tokenContract =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellTokenContract : buyTokenContract;

  const tokenAddr = useMemo(() => lower(tokenContract?.address), [tokenContract?.address]);
  const tokenDecimals = tokenContract?.decimals ?? 18;

  const [inputValue, setInputValue] = useState<string>('0');
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

  // Mirror token selection into local panel state only when the address changes
  const prevAddrRef = useRef<string>('');
  useEffect(() => {
    if (!tokenAddr && !prevAddrRef.current) return;
    if (tokenAddr === prevAddrRef.current) return;

    prevAddrRef.current = tokenAddr || '';

    if (tokenAddr) {
      debugLog.log(`📦 Loaded token for ${SP_COIN_DISPLAY[containerType]}:`, tokenAddr);
      setLocalTokenContract(tokenContract as any);
    }
  }, [tokenAddr, containerType, setLocalTokenContract, tokenContract]);

  // When token cleared, zero local/global amounts and UI input
  const wasDefinedRef = useRef<boolean>(Boolean(tokenAddr));
  useEffect(() => {
    const wasDefined = wasDefinedRef.current;
    const isDefined = Boolean(tokenAddr);

    if (wasDefined && !isDefined) {
      setLocalTokenContract(undefined as any);
      setLocalAmount(0n);
      setInputValue('0');

      if (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
        if (sellAmount !== 0n) setSellAmount(0n);
      } else {
        if (buyAmount !== 0n) setBuyAmount(0n);
      }
    }

    wasDefinedRef.current = isDefined;
  }, [
    tokenAddr,
    containerType,
    setLocalTokenContract,
    setLocalAmount,
    sellAmount,
    buyAmount,
    setSellAmount,
    setBuyAmount,
  ]);

  // Treat ".", "123.", "123.0…" as mid-typing states
  const isIntermediateDecimal = (s: string): boolean =>
    s === '.' || /^\d+\.$/.test(s) || /^\d+\.\d*0$/.test(s);

  // Give the user a grace window while typing to avoid mirror overwrites
  const typingUntilRef = useRef<number>(0);

  // Keep input text synced to the selected token’s own global amount
  const currentAmount =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? sellAmount : buyAmount;

  useEffect(() => {
    if (!tokenAddr) return;
    if (isIntermediateDecimal(inputValue)) return;
    if (Date.now() < typingUntilRef.current) return;

    const formattedRaw = formatUnits(currentAmount ?? 0n, tokenDecimals);
    const formatted = clampDisplay(formattedRaw, maxInputSz);
    if (inputValue !== formatted) setInputValue(formatted);
  }, [tokenAddr, tokenDecimals, currentAmount, containerType, inputValue]);

  // Debounced amount → side-effects (quotes/validation) via CustomEvent
  const lastDebouncedRef = useRef<bigint | null>(null);
  const debouncedForPanel =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
      ? debouncedSellAmount
      : debouncedBuyAmount;

  useEffect(() => {
    const directionOk =
      (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL &&
        tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) ||
      (containerType === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL &&
        tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN);
    if (!directionOk) return;

    if (lastDebouncedRef.current === debouncedForPanel) return;
    lastDebouncedRef.current = debouncedForPanel ?? null;

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('spcoin:debouncedAmount', {
            detail: {
              amount: debouncedForPanel,
              containerType,
              tradeDirection,
              token: tokenAddr || undefined,
            },
          }),
        );
      } catch {
        /* no-op */
      }
    }
  }, [debouncedForPanel, containerType, tradeDirection, tokenAddr]);

  const handleInputChange = (value: string) => {
    typingUntilRef.current = Date.now() + TYPING_GRACE_MS;
    if (!/^\d*\.?\d*$/.test(value)) return;

    const normalized = value.replace(/^0+(?!\.)/, '') || '0';
    setInputValue(normalized);

    if (isIntermediateDecimal(normalized)) return;
    if (!tokenAddr) return;

    const decimals = tokenDecimals;
    const formatted = parseValidFormattedAmount(normalized, decimals);

    try {
      const bigIntValue = parseUnits(formatted, decimals);
      setLocalAmount(bigIntValue);

      if (containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL) {
        if (tradeDirection !== TRADE_DIRECTION.SELL_EXACT_OUT) {
          setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
        }
        if (sellAmount !== bigIntValue) setSellAmount(bigIntValue);
      } else {
        if (tradeDirection !== TRADE_DIRECTION.BUY_EXACT_IN) {
          setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN);
        }
        if (buyAmount !== bigIntValue) setBuyAmount(bigIntValue);
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

  // Live balance (SSOT)
  const chainId = exchangeContext?.network?.chainId ?? 1;
  const {
    balance,
    formatted: liveFormattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useGetBalance({
    chainId,
    tokenAddress: tokenContract?.address as Address | undefined,
    decimalsHint: tokenDecimals,
    enabled: Boolean(tokenContract?.address),
  });

  // Mirror live balance into ExchangeContext.tradeData.*TokenContract
  const side = containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL ? 'sell' : 'buy';
  useContextBalance({
    balance,
    tokenAddress: tokenContract?.address as Address | undefined,
    side,
    enabled: Boolean(tokenContract?.address),
    mirrorTradeToken: true,
  });

  const formattedBalance =
    balanceError ? '—' : balanceLoading ? '…' : (liveFormattedBalance ?? '0.0');

  const isInputDisabled =
    !tokenAddr ||
    (apiProvider === API_TRADING_PROVIDER.API_0X &&
      containerType === SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL);

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
      {/* Invisible decoy to placate aggressive managers */}
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

export default function TradeAssetPanel({ containerType }: { containerType: SP_COIN_DISPLAY }) {
  return (
    <TokenPanelProvider containerType={containerType}>
      <TradeAssetPanelInner />
    </TokenPanelProvider>
  );
}
