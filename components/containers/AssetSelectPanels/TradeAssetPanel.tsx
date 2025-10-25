// File: components/containers/AssetSelectPanels/TradeAssetPanel.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
import { useBalanceSSOT, USE_BALANCE_SSOT_BUILD } from '@/lib/hooks/trade/useBalanceSSOT';
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

/**
 * ----------------------------
 * PURE RENDERING PANEL (no fetching)
 * ----------------------------
 * Receives balance + owner as props; does not call useBalanceSSOT or resolve owner.
 */
type PureProps = {
  containerTypeRoot: SP_ROOT.SELL_SELECT_PANEL | SP_ROOT.BUY_SELECT_PANEL;
  apiProvider: API_TRADING_PROVIDER;
  chainId: number;

  // token selection (still provided by TokenPanelProvider via useTokenSelection)
  tokenAddr?: Address;
  tokenDecimals: number;
  tokenContract: any; // keep as-is from your code

  // amounts + direction + slippage
  sellAmount: bigint | undefined;
  setSellAmount: (v: bigint) => void;
  buyAmount: bigint | undefined;
  setBuyAmount: (v: bigint) => void;
  tradeDirection: TRADE_DIRECTION;
  setTradeDirection: (d: TRADE_DIRECTION) => void;
  slippagePctText: string;

  // balance/owner are injected
  owner?: Address;
  balanceFormatted?: string;
  balanceLoading?: boolean;
  balanceError?: Error | null;
};

function PureTradeAssetPanel({
  containerTypeRoot,
  apiProvider,
  chainId,
  tokenAddr,
  tokenDecimals,
  tokenContract,

  sellAmount,
  setSellAmount,
  buyAmount,
  setBuyAmount,
  tradeDirection,
  setTradeDirection,
  slippagePctText,

  owner,
  balanceFormatted = '0.0',
  balanceLoading = false,
  balanceError = null,
}: PureProps) {
  const isBuy = containerTypeRoot === SP_ROOT.BUY_SELECT_PANEL;
  const isSell = containerTypeRoot === SP_ROOT.SELL_SELECT_PANEL;

  // BUY-side UI gating via panel tree (unchanged)
  usePanelTree();

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

  const { setLocalAmount } = useTokenPanelContext();

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

  const onChangeAmount = useCallback((value: string) => {
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
  }, [
    isSell,
    tokenAddr,
    tokenDecimals,
    tradeDirection,
    sellAmount,
    buyAmount,
    setSellAmount,
    setBuyAmount,
    setTradeDirection,
    setLocalAmount,
  ]);

  const buySellText = isSell
    ? (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
      ? `You Pay ± ${slippagePctText}`
      : `You Exactly Pay:`)
    : (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
      ? `You Receive ± ${slippagePctText}`
      : `You Exactly Receive:`);

  // Friendlier display when wallet isn’t connected
  const finalBalanceDisplay =
    !owner
      ? 'Connect wallet'
      : balanceError
        ? '—'
        : balanceLoading
          ? '…'
          : balanceFormatted ?? '0.0';

  const isInputDisabled =
    !tokenAddr || (apiProvider === API_TRADING_PROVIDER.API_0X && isBuy);

  const noAutofillName = useMemo(
    () => `no-autofill-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const symbol =
    (tokenContract as any)?.symbol ??
    (tokenContract as any)?.name ??
    '(unknown)';

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
        Balance: {finalBalanceDisplay}
      </div>

      {/* SELL panel: render manage button; its own component governs visibility */}
      {isSell && <ManageSponsorsButton />}

      {/* BUY panel: recipient gating via panel-tree */}
      {isBuy && <AddSponsorshipButton />}
    </div>
  );
}

// ⬇️ Memoize to avoid sibling-triggered re-renders
const MemoPureTradeAssetPanel = React.memo(PureTradeAssetPanel, (prev, next) => {
  return (
    prev.containerTypeRoot === next.containerTypeRoot &&
    prev.apiProvider === next.apiProvider &&
    prev.chainId === next.chainId &&
    prev.tokenAddr === next.tokenAddr &&
    prev.tokenDecimals === next.tokenDecimals &&
    prev.tokenContract === next.tokenContract &&
    prev.sellAmount === next.sellAmount &&
    prev.buyAmount === next.buyAmount &&
    prev.tradeDirection === next.tradeDirection &&
    prev.slippagePctText === next.slippagePctText &&
    prev.owner === next.owner &&
    prev.balanceFormatted === next.balanceFormatted &&
    prev.balanceLoading === next.balanceLoading &&
    prev.balanceError === next.balanceError
  );
});

/**
 * ----------------------------
 * ADAPTER (per-panel effects)
 * ----------------------------
 * Resolves owner minimally and calls useBalanceSSOT ONLY for the active side.
 * Keeps the rest of your business logic unchanged.
 */
function TradeAssetPanelAdapter({
  containerType,
}: {
  containerType: SP_ROOT.SELL_SELECT_PANEL | SP_ROOT.BUY_SELECT_PANEL;
}) {
  const [apiProvider] = useApiProvider();
  const { exchangeContext } = useExchangeContext();
  const wagmiAcc = useAccount();

  // 🧪 Confirm which balance hook build we’re actually using
  useEffect(() => {
    console.log('[TradeAssetPanel] using hook build:', USE_BALANCE_SSOT_BUILD);
  }, []);

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const { data: slippage } = useSlippage();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();

  const { setLocalTokenContract, setLocalAmount } = useTokenPanelContext();

  const isBuy = containerType === SP_ROOT.BUY_SELECT_PANEL;
  const isSell = containerType === SP_ROOT.SELL_SELECT_PANEL;

  // selection state (unchanged)
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

  // Basic mount log
  useEffect(() => {
    clog('mounted', {
      hasWindow: typeof window !== 'undefined',
      containerTypeRoot: containerType,
      apiProvider,
      exchangeChainId: exchangeContext?.network?.chainId,
    });
  }, [apiProvider, exchangeContext?.network?.chainId, containerType]);

  // OWNER RESOLUTION (scoped)
  const chainId = exchangeContext?.network?.chainId ?? 1;

  const wagmiOwner = (wagmiAcc?.address ?? undefined) as Address | undefined;

  const ctxOwner =
    ((exchangeContext as any)?.account?.address as Address | undefined) ??
    ((exchangeContext as any)?.wallet?.address as Address | undefined) ??
    ((exchangeContext as any)?.address as Address | undefined);

  const [providerOwner, setProviderOwner] = useState<Address | undefined>(undefined);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eth = (window as any)?.ethereum;
    const sel = eth?.selectedAddress as Address | undefined;
    if (sel && isAddress(sel)) {
      setProviderOwner(sel);
      return;
    }
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

  const tokenAddrHex: Address | undefined = (tokenAddr && isAddress(tokenAddr))
    ? (tokenAddr as Address)
    : undefined;

  // ✅ Gate balance fetching to only the ACTIVE side based on tradeDirection
  const isActiveForBalances =
    (isSell && tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) ||
    (isBuy && tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN);

  // BALANCE (scoped to this panel only; inactive side is disabled)
  useEffect(() => {
    const symbol =
      (tokenContract as any)?.symbol ??
      (tokenContract as any)?.name ??
      '(unknown)';
    clog('pre useBalanceSSOT params', {
      chainId,
      tokenAddress: tokenAddrHex,
      decimalsHint: tokenDecimals,
      owner: owner ?? null,
      symbol,
      enabled: Boolean(tokenAddrHex && owner && isActiveForBalances),
      isActiveForBalances,
      tradeDirection,
      isSell,
      isBuy,
    });
  }, [chainId, tokenAddrHex, tokenDecimals, owner, tokenContract, isActiveForBalances, tradeDirection, isSell, isBuy]);

  const {
    formatted: liveFormattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useBalanceSSOT({
    chainId,
    tokenAddress: tokenAddrHex,
    owner,
    decimalsHint: tokenDecimals,
    enabled: Boolean(tokenAddrHex && owner && isActiveForBalances),
  });

  // hand off to the pure panel
  return (
    <MemoPureTradeAssetPanel
      containerTypeRoot={containerType}
      apiProvider={apiProvider}
      chainId={chainId}
      tokenAddr={tokenAddrHex}
      tokenDecimals={tokenDecimals}
      tokenContract={tokenContract}
      sellAmount={sellAmount}
      setSellAmount={setSellAmount}
      buyAmount={buyAmount}
      setBuyAmount={setBuyAmount}
      tradeDirection={tradeDirection}
      setTradeDirection={setTradeDirection}
      slippagePctText={slippage.percentageString}
      owner={owner}
      balanceFormatted={liveFormattedBalance}
      balanceLoading={balanceLoading}
      balanceError={balanceError}
    />
  );
}

/**
 * Keep the external API the same:
 * default export takes { containerType } and provides TokenPanelProvider.
 */
export default function TradeAssetPanel({
  containerType,
}: {
  containerType: SP_ROOT.SELL_SELECT_PANEL | SP_ROOT.BUY_SELECT_PANEL;
}) {
  return (
    <TokenPanelProvider containerType={containerType}>
      <TradeAssetPanelAdapter containerType={containerType} />
    </TokenPanelProvider>
  );
}
