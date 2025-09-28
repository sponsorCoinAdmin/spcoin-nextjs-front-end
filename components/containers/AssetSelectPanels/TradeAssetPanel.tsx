// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

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

import {
  SP_COIN_DISPLAY as SP_ROOT,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
} from '@/lib/structure';

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

import { useConfigButtonVisibility } from '@/lib/hooks/trade/useConfigButtonVisibility';

// (optional) only needed if you still hide Add while inline panel is open
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

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

  const { setLocalTokenContract, setLocalAmount, containerType: containerTypeRoot } =
    useTokenPanelContext();

  const isBuy  = containerTypeRoot === SP_ROOT.BUY_SELECT_PANEL;
  const isSell = containerTypeRoot === SP_ROOT.SELL_SELECT_PANEL;

  // ✅ Explicitly select the token for THIS side for button visibility logic
  const tokenContractForSide = isSell ? sellTokenContract : buyTokenContract;

  // Token selection state (used for amounts/decimals/etc.)
  const { tokenContract, tokenAddr, tokenDecimals } = useTokenSelection({
    containerType: containerTypeRoot,
    sellTokenContract,
    buyTokenContract,
    setLocalTokenContract,
    setLocalAmount,
    sellAmount,
    buyAmount,
    setSellAmount,
    setBuyAmount,
  });

  // ✅ Feed the side-specific token into the visibility hook
  const { showManageBtn, showRecipientBtn } = useConfigButtonVisibility({
    isSell,
    isBuy,
    tokenContract: tokenContractForSide,
  });

  // (optional) if you still want to hide Add when inline panel is open
  const { isVisible } = usePanelTree();
  const isRecipientPanelOpen = isVisible(SP_TREE.RECIPIENT_SELECT_PANEL);
  const showRecipientBtnFinal = showRecipientBtn && !isRecipientPanelOpen;

  // Amount input state
  const [inputValue, setInputValue] = useState('0');
  const debouncedSell = useDebounce(sellAmount, 600);
  const debouncedBuy  = useDebounce(buyAmount, 600);

  const typingUntilRef = useRef(0);
  const currentAmount = isSell ? sellAmount : buyAmount;

  useEffect(() => {
    if (isIntermediateDecimal(inputValue)) return;
    if (Date.now() < typingUntilRef.current) return;

    if (!tokenAddr) {
      if (inputValue !== '0') setInputValue('0');
      return;
    }

    const raw = formatUnits(currentAmount ?? 0n, tokenDecimals);
    const formatted = clampDisplay(raw, maxInputSz);
    if (inputValue !== formatted) setInputValue(formatted);
  }, [tokenAddr, tokenDecimals, currentAmount, inputValue]);

  useEffect(() => {
    if (!tokenAddr) setLocalAmount(0n);
  }, [tokenAddr, setLocalAmount]);

  const lastDebouncedRef = useRef<bigint | null>(null);
  const debouncedForPanel = isSell ? debouncedSell : debouncedBuy;

  useEffect(() => {
    const correctDirection =
      (isSell && tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) ||
      (!isSell && tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN);
    if (!correctDirection) return;

    if (lastDebouncedRef.current === debouncedForPanel) return;
    lastDebouncedRef.current = debouncedForPanel ?? null;

    window.dispatchEvent(
      new CustomEvent('spcoin:debouncedAmount', {
        detail: {
          amount: debouncedForPanel,
          containerType: containerTypeRoot,
          tradeDirection,
          token: tokenAddr || undefined,
        },
      }),
    );
  }, [debouncedForPanel, isSell, tradeDirection, tokenAddr, containerTypeRoot]);

  const onChangeAmount = (value: string) => {
    typingUntilRef.current = Date.now() + TYPING_GRACE_MS;
    if (!/^\d*\.?\d*$/.test(value)) return;

    const normalized = value.replace(/^0+(?!\.)/, '') || '0';
    setInputValue(normalized);

    if (isIntermediateDecimal(normalized) || !tokenAddr) return;

    const formatted = parseValidFormattedAmount(normalized, tokenDecimals);
    try {
      const bi = parseUnits(formatted, tokenDecimals);
      setLocalAmount(bi);

      if (isSell) {
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

  const buySellText = isSell
    ? (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
        ? `You Pay ± ${slippage.percentageString}`
        : `You Exactly Pay:`)
    : (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
        ? `You Receive ± ${slippage.percentageString}`
        : `You Exactly Receive:`);

  const chainId = exchangeContext?.network?.chainId ?? 1;
  const {
    formatted: liveFormattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useBalanceSSOT({
    chainId,
    tokenAddress: tokenContract?.address as Address | undefined,
    tokenDecimals,
    containerType: containerTypeRoot,
  });

  const formattedBalance =
    balanceError ? '—' : balanceLoading ? '…' : liveFormattedBalance ?? '0.0';

  const isInputDisabled =
    !tokenAddr || (apiProvider === API_TRADING_PROVIDER.API_0X && isBuy);

  const noAutofillName = useMemo(
    () => `no-autofill-${Math.random().toString(36).slice(2)}`,
    [],
  );

  return (
    <div
      id="TradeAssetPanelInner"
      className={clsx('relative mt-[5px] mb-[5px]', 'rounded-[12px] overflow-hidden')}
    >
      <input
        id="TokenPanelInputAmount"
        className={clsx(
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
          const n = parseFloat(inputValue);
          setInputValue(clampDisplay(isNaN(n) ? '0' : String(n), 10));
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

      <TokenSelectDropDown
        containerType={
          (isSell ? SP_ROOT.SELL_SELECT_PANEL : SP_ROOT.BUY_SELECT_PANEL) as
            | SP_ROOT.SELL_SELECT_PANEL
            | SP_ROOT.BUY_SELECT_PANEL
        }
      />

      <div className="absolute top-5 left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        {buySellText}
      </div>

      <div className="absolute top-[74px] right-5 min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        Balance: {formattedBalance}
      </div>

      {/* ✅ Correct buttons per side */}
      {showManageBtn && <ManageSponsorsButton tokenContract={tokenContractForSide} />}
      {showRecipientBtnFinal && <AddSponsorshipButton />}
    </div>
  );
}

export default function TradeAssetPanel({
  containerType,
}: {
  containerType: SP_ROOT.SELL_SELECT_PANEL | SP_ROOT.BUY_SELECT_PANEL;
}) {
  return (
    <TokenPanelProvider containerType={containerType}>
      <TradeAssetPanelInner />
    </TokenPanelProvider>
  );
}
