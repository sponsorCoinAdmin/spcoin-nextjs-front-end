'use client';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Address, formatUnits, parseUnits } from 'viem';
import { clsx } from 'clsx';

import {
  useApiProvider,
  useBuyAmount,
  useSellAmount,
  useSlippage,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
  useExchangeContext,
} from '@/lib/context/hooks';

import { SP_COIN_DISPLAY, TRADE_DIRECTION, API_TRADING_PROVIDER } from '@/lib/structure';
import { parseValidFormattedAmount } from '@/lib/spCoin/coreUtils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useTokenSelection } from '@/lib/hooks/trade/useTokenSelection';
import { useBalanceSSOT } from '@/lib/hooks/trade/useBalanceSSOT';
import { clampDisplay, isIntermediateDecimal, maxInputSz, TYPING_GRACE_MS } from '@/lib/utils/tradeFormat';

import ManageSponsorsButton from '@/components/Buttons/ManageSponsorsButton';
import AddSponsorshipButton from '@/components/Buttons/AddSponsorshipButton';
import TokenSelectDropDown from '../AssetSelectDropDowns/TokenSelectDropDown';
import { TokenPanelProvider, useTokenPanelContext } from '@/lib/context/providers/Panels';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TradeAssetPanel', DEBUG, false);

function TradeAssetPanelInner() {
  const [apiProvider] = useApiProvider();
  const { exchangeContext } = useExchangeContext();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();

  const { setLocalTokenContract, setLocalAmount, containerType } = useTokenPanelContext();

  const { openPanel } = usePanelTree();

  // Token selection state
  const { tokenContract, tokenAddr, tokenDecimals } = useTokenSelection({
    containerType,
    sellTokenContract,
    buyTokenContract,
    setLocalTokenContract,
    setLocalAmount,
    sellAmount,
    buyAmount,
    setSellAmount,
    setBuyAmount,
  });

  // Input text
  const [inputValue, setInputValue] = useState('0');
  const debouncedSell = useDebounce(sellAmount, 600);
  const debouncedBuy = useDebounce(buyAmount, 600);

  // Sync panel input with global amount (for *this* side)
  const typingUntilRef = useRef(0);
  const currentAmount =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? sellAmount : buyAmount;

  useEffect(() => {
    // If user is actively typing, don't overwrite
    if (isIntermediateDecimal(inputValue)) return;
    if (Date.now() < typingUntilRef.current) return;

    // If token is cleared, explicitly reflect "0" in the input
    if (!tokenAddr) {
      if (inputValue !== '0') {
        DEBUG && debugLog.log(`Input reset → token cleared: "${inputValue}" → "0"`);
        setInputValue('0');
      }
      return;
    }

    // Normal sync when a token exists
    const formattedRaw = formatUnits(currentAmount ?? 0n, tokenDecimals);
    const formatted = clampDisplay(formattedRaw, maxInputSz);
    if (inputValue !== formatted) {
      DEBUG && debugLog.log(`Input sync → "${inputValue}" → "${formatted}"`);
      setInputValue(formatted);
    }
  }, [tokenAddr, tokenDecimals, currentAmount, containerType, inputValue]);

  // Ensure local panel amount is zeroed when token is cleared (keeps local/UI in lockstep)
  useEffect(() => {
    if (!tokenAddr) {
      DEBUG && debugLog.log('Local amount reset → token cleared');
      setLocalAmount(0n);
    }
  }, [tokenAddr, setLocalAmount]);

  // Emit debounced amount event (kept as-is if other parts listen)
  const lastDebouncedRef = useRef<bigint | null>(null);
  const debouncedForPanel =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? debouncedSell : debouncedBuy;

  useEffect(() => {
    const directionOk =
      (containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST &&
        tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) ||
      (containerType === SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST &&
        tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN);
    if (!directionOk) return;

    if (lastDebouncedRef.current === debouncedForPanel) return;
    lastDebouncedRef.current = debouncedForPanel ?? null;

    if (typeof window !== 'undefined') {
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
    }
  }, [debouncedForPanel, containerType, tradeDirection, tokenAddr]);

  // Input change → parse → update local/global
  const onChangeAmount = (value: string) => {
    typingUntilRef.current = Date.now() + TYPING_GRACE_MS;
    if (!/^\d*\.?\d*$/.test(value)) return;

    const normalized = value.replace(/^0+(?!\.)/, '') || '0';
    setInputValue(normalized);

    if (isIntermediateDecimal(normalized)) return;
    if (!tokenAddr) return;

    const formatted = parseValidFormattedAmount(normalized, tokenDecimals);
    try {
      const bi = parseUnits(formatted, tokenDecimals);
      setLocalAmount(bi);

      if (containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST) {
        if (tradeDirection !== TRADE_DIRECTION.SELL_EXACT_OUT)
          setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
        if (sellAmount !== bi) setSellAmount(bi);
      } else {
        if (tradeDirection !== TRADE_DIRECTION.BUY_EXACT_IN)
          setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN);
        if (buyAmount !== bi) setBuyAmount(bi);
      }
    } catch (e) {
      debugLog.warn('parseUnits failed', e);
    }
  };

  // Copy text for “You Pay/Receive …”
  const buySellText =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST
      ? tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
        ? `You Pay ± ${slippage.percentageString}`
        : `You Exactly Pay:`
      : tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
        ? `You Receive ± ${slippage.percentageString}`
        : `You Exactly Receive:`;

  // SSOT balance + mirror to context
  const chainId = exchangeContext?.network?.chainId ?? 1;
  const {
    formatted: liveFormattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useBalanceSSOT({
    chainId,
    tokenAddress: tokenContract?.address as Address | undefined,
    tokenDecimals,
    containerType,
  });

  const formattedBalance = balanceError
    ? '—'
    : balanceLoading
      ? '…'
      : liveFormattedBalance ?? '0.0';

  const isInputDisabled =
    !tokenAddr ||
    (apiProvider === API_TRADING_PROVIDER.API_0X &&
      containerType === SP_COIN_DISPLAY.BUY_SELECT_PANEL_LIST);

  const noAutofillName = useMemo(
    () => `no-autofill-${Math.random().toString(36).slice(2)}`,
    [],
  );

  return (
    <div
      id="TradeAssetPanelInner"
      className={clsx(
        // container (replaces styles.tokenSelectContainer)
        'relative mt-[5px] mb-[5px]',
        'rounded-[12px] overflow-hidden'
      )}
    >
      <input
        id="TokenPanelInputAmount"
        className={clsx(
          // replaces styles.priceInput + styles.withBottomRadius
          'w-full h-[106px] indent-[10px] pt-[10px]',
          'bg-[#1f2639] text-[#94a3b8] text-[25px]',
          'border-0 outline-none focus:outline-none',
          'rounded-b-[12px]'
        )}
        placeholder="0"
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => onChangeAmount(e.target.value)}
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

      {/* Invisible decoy for autofill managers */}
      <input
        type="text"
        autoComplete="new-password"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 h-0 w-0 pointer-events-none"
      />

      <TokenSelectDropDown containerType={containerType} />

      {/* replaces styles.buySell */}
      <div className="absolute top-5 left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        {buySellText}
      </div>

      {/* replaces styles.assetBalance */}
      <div className="absolute top-[74px] right-5 min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        Balance: {formattedBalance}
      </div>

      {
          // ✅ Call openPanel AFTER render (avoids setState during render warning)
          // useEffect(() => {
          //   openPanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_BUTTON);
          // }, [openPanel]);

        containerType === SP_COIN_DISPLAY.SELL_SELECT_PANEL_LIST ? (
          <ManageSponsorsButton tokenContract={tokenContract} />
        ) : (
          <AddSponsorshipButton />
        )
      }
    </div>
  );
}

export default function TradeAssetPanel({
  containerType,
}: {
  containerType: SP_COIN_DISPLAY;
}) {
  return (
    <TokenPanelProvider containerType={containerType}>
      <TradeAssetPanelInner />
    </TokenPanelProvider>
  );
}
