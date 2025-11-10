// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { clsx } from 'clsx';
import { useAccount } from 'wagmi';

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

import { parseValidFormattedAmount, isSpCoin } from '@/lib/spCoin/coreUtils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useTokenSelection } from '@/lib/hooks/trade/useTokenSelection';
import { useFormattedBalance } from '@/lib/hooks/trade/useFormattedBalance';
import { clampDisplay, isIntermediateDecimal, maxInputSz, TYPING_GRACE_MS } from '@/lib/utils/tradeFormat';

import ManageSponsorsButton from '@/components/Buttons/ManageSponsorsButton';
import AddSponsorshipButton from '@/components/Buttons/AddSponsorshipButton';
import TokenSelectDropDown from '../AssetSelectDropDowns/TokenSelectDropDown';
import { TokenPanelProvider, useTokenPanelContext } from '@/lib/context/providers/Panels';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TradeAssetPanel', DEBUG, false);

function TradeAssetPanelInner() {
  const [apiProvider] = useApiProvider();
  const { exchangeContext, setSellBalance, setBuyBalance } = useExchangeContext();
  const { address } = useAccount();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();

  const { setLocalTokenContract, setLocalAmount, containerType: containerTypeRoot } =
    useTokenPanelContext();

  const isBuy = containerTypeRoot === SP_ROOT.BUY_SELECT_PANEL;
  const isSell = containerTypeRoot === SP_ROOT.SELL_SELECT_PANEL;

  // selection state
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

  // Panel tree controls for visibility toggles
  const { openPanel, closePanel } = usePanelTree();

  // ────────────────────────────────────────────────────────────────────────────
  // Add Sponsorship BUTTON gate (BUY-side only):
  // Flip ONLY the button node's visibility when buyTokenContract.address changes.
  // ────────────────────────────────────────────────────────────────────────────
  const prevBuyAddrRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isBuy) return; // only BUY side manages the Add button/panel

    const addr = buyTokenContract?.address as string | undefined;

    // React only when the buy address actually changes
    if (prevBuyAddrRef.current === addr) return;
    prevBuyAddrRef.current = addr;

    // Toggle only the BUTTON visibility; also ensure the PANEL is closed on non-SpCoin
    if (!addr) {
      closePanel(SP_ROOT.ADD_SPONSORSHIP_BUTTON, 'TradeAssetPanel:BUY.addrUnset');
      closePanel(SP_ROOT.ADD_SPONSORSHIP_PANEL, 'TradeAssetPanel:BUY.addrUnset');
      return;
    }

    if (isSpCoin(buyTokenContract)) {
      openPanel(SP_ROOT.ADD_SPONSORSHIP_BUTTON, 'TradeAssetPanel:BUY.isSpCoin');
    } else {
      closePanel(SP_ROOT.ADD_SPONSORSHIP_BUTTON, 'TradeAssetPanel:BUY.notSpCoin');
      closePanel(SP_ROOT.ADD_SPONSORSHIP_PANEL, 'TradeAssetPanel:BUY.notSpCoin');
    }
  }, [isBuy, buyTokenContract?.address, openPanel, closePanel]);
  // ────────────────────────────────────────────────────────────────────────────

  // amount input
  const [inputValue, setInputValue] = useState('0');
  const debouncedSell = useDebounce(sellAmount, 600);
  const debouncedBuy = useDebounce(buyAmount, 600);

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
    ? tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
      ? `You Pay ± ${slippage.percentageString}`
      : `You Exactly Pay:`
    : tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
    ? `You Receive ± ${slippage.percentageString}`
    : `You Exactly Receive:`;

  const chainId = exchangeContext?.network?.chainId ?? 1;

  // ✅ useFormattedBalance expects: { chainId, tokenAddress, owner?, decimalsHint?, enabled? }
  const {
    formatted: liveFormattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useFormattedBalance({
    chainId,
    tokenAddress: tokenContract?.address as Address | undefined,
    owner: (address ?? undefined) as Address | undefined,
    decimalsHint: tokenDecimals,
    enabled: Boolean(tokenAddr && address),
  });

  const formattedBalance =
    balanceError ? '—' : balanceLoading ? '…' : liveFormattedBalance ?? '0.0';

  // 🔁 Push live balance into ExchangeContext (only when stable / non-loading / no error)
  const prevPushedBalanceRef = useRef<bigint | undefined>(undefined);
  useEffect(() => {
    if (!tokenAddr || !address) return;
    if (balanceLoading || balanceError) return;
    if (liveFormattedBalance == null || tokenDecimals == null) return;

    let parsed: bigint | undefined;
    try {
      parsed = parseUnits(liveFormattedBalance, tokenDecimals);
    } catch {
      return;
    }

    if (prevPushedBalanceRef.current === parsed) return; // avoid spam
    prevPushedBalanceRef.current = parsed;

    debugLog.log('balance sync', {
      side: isSell ? 'SELL' : 'BUY',
      tokenAddr: tokenAddr,
      liveFormattedBalance,
      parsed: String(parsed),
      prevBal:
        exchangeContext?.tradeData?.[
          isSell ? 'sellTokenContract' : 'buyTokenContract'
        ]?.balance?.toString?.(),
    });

    if (isSell) {
      setSellBalance?.(parsed);
    } else {
      setBuyBalance?.(parsed);
    }
  }, [
    address,
    tokenAddr,
    tokenDecimals,
    liveFormattedBalance,
    balanceLoading,
    balanceError,
    isSell,
    setSellBalance,
    setBuyBalance,
    exchangeContext?.tradeData?.buyTokenContract?.balance,
    exchangeContext?.tradeData?.sellTokenContract?.balance,
  ]);

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

      {/* SELL panel: render manage button; its own component governs visibility */}
      {isSell && <ManageSponsorsButton />}

      {/* BUY panel: recipient gating via panel-tree */}
      {isBuy && <AddSponsorshipButton />}
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
