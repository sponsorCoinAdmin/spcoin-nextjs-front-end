// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Address, formatUnits, parseUnits, isAddress } from 'viem';
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

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TradeAssetPanel', DEBUG, false);

// Simple console logger (always on)
const clog = (...args: any[]) => console.log('[TradeAssetPanel]', ...args);

function TradeAssetPanelInner() {
  const [apiProvider] = useApiProvider();
  const { exchangeContext } = useExchangeContext();
  const wagmiAcc = useAccount(); // ✅ best source of the connected address

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

  // 🔎 Hydration + mount check
  useEffect(() => {
    clog('mounted', {
      hasWindow: typeof window !== 'undefined',
      containerTypeRoot,
      apiProvider,
      exchangeChainId: exchangeContext?.network?.chainId,
    });
  }, [apiProvider, exchangeContext?.network?.chainId, containerTypeRoot]);

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

  // 🔎 Sanity log on selection change
  useEffect(() => {
    const symbol =
      (tokenContract as any)?.symbol ??
      (tokenContract as any)?.name ??
      '(unknown)';
    clog('token selection changed', {
      symbol,
      tokenAddr,
      tokenDecimals,
      tokenContractAddress: (tokenContract as any)?.address,
      isBuy,
      isSell,
    });
  }, [tokenAddr, tokenDecimals, tokenContract, isBuy, isSell]);

  // BUY-side UI gating via panel tree (unchanged)
  usePanelTree();

  // amount input
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

    clog('dispatch spcoin:debouncedAmount', {
      amount: debouncedForPanel?.toString(),
      containerType: containerTypeRoot,
      tradeDirection,
      token: tokenAddr || undefined,
    });

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

      clog('onChangeAmount', {
        input: value,
        normalized,
        parsed: bi.toString(),
        isSell,
        tradeDirectionBefore: tradeDirection,
      });

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
      clog('parseUnits failed', e);
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

  // -------- OWNER RESOLUTION (NEW) --------
  // 1) wagmi
  const wagmiOwner = (wagmiAcc?.address ?? undefined) as Address | undefined;

  // 2) exchangeContext fallbacks
  const ctxOwner =
    ((exchangeContext as any)?.account?.address as Address | undefined) ??
    ((exchangeContext as any)?.wallet?.address as Address | undefined) ??
    ((exchangeContext as any)?.address as Address | undefined);

  // 3) window.ethereum.selectedAddress / eth_accounts
  const [providerOwner, setProviderOwner] = useState<Address | undefined>(undefined);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eth = (window as any)?.ethereum;
    const sel = eth?.selectedAddress as Address | undefined;
    if (sel && isAddress(sel)) {
      setProviderOwner(sel);
      return;
    }
    // Try eth_accounts if selectedAddress is empty
    (async () => {
      try {
        if (!eth?.request) return;
        const accounts: string[] = await eth.request({ method: 'eth_accounts' });
        if (accounts?.[0] && isAddress(accounts[0])) {
          setProviderOwner(accounts[0] as Address);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const owner: Address | undefined = wagmiOwner ?? ctxOwner ?? providerOwner;

  // Log where the owner came from
  useEffect(() => {
    clog('owner resolution', {
      wagmiOwner,
      ctxOwner,
      providerOwner,
      chosenOwner: owner,
      ownerIsValid: owner ? isAddress(owner) : false,
      wagmiStatus: wagmiAcc?.status,
    });
  }, [wagmiOwner, ctxOwner, providerOwner, owner, wagmiAcc?.status]);

  // -------- BALANCE HOOK CALL --------
  useEffect(() => {
    const symbol =
      (tokenContract as any)?.symbol ??
      (tokenContract as any)?.name ??
      '(unknown)';
    clog('pre useBalanceSSOT params', {
      chainId,
      tokenAddress: tokenAddr,
      decimalsHint: tokenDecimals,
      owner: owner ?? null,
      symbol,
      enabled: Boolean(tokenAddr && owner),
    });
  }, [chainId, tokenAddr, tokenDecimals, owner, tokenContract]);

  const {
    formatted: liveFormattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useBalanceSSOT({
    chainId,
    tokenAddress: (tokenAddr || undefined) as Address | undefined,
    owner,                            // ✅ REQUIRED; previously null in your logs
    decimalsHint: tokenDecimals,
    enabled: Boolean(tokenAddr && owner),
  });

  // 🔎 Log the hook outputs
  useEffect(() => {
    clog('useBalanceSSOT state', {
      balanceLoading,
      balanceError: !!balanceError,
      liveFormattedBalance,
      tokenAddr,
      tokenDecimals,
      chainId,
      owner,
    });
    if (balanceError) {
      console.error('[TradeAssetPanel] useBalanceSSOT error detail:', balanceError);
    }
  }, [balanceLoading, balanceError, liveFormattedBalance, tokenAddr, tokenDecimals, chainId, owner]);

  // Friendlier display when wallet isn’t connected
  const formattedBalance =
    !owner
      ? 'Connect wallet'
      : balanceError
        ? '—'
        : balanceLoading
          ? '…'
          : liveFormattedBalance ?? '0.0';

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
