// File: @/components/containers/AssetSelectPanels/TradingSpCoinPanel.tsx
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { clsx } from 'clsx';
import styles from '@/styles/Exchange.module.css';

import {
  useBuyAmount,
  useSellAmount,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
  useExchangeContext,
} from '@/lib/context/hooks';

import {
  SP_COIN_DISPLAY,
  TRADE_DIRECTION,
  type TokenContract,
} from '@/lib/structure';

import { parseValidFormattedAmount } from '@/lib/spCoin/coreUtils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { useTokenSelection } from '@/lib/hooks/trade/useTokenSelection';
import {
  clampDisplay,
  isIntermediateDecimal,
  maxInputSz,
  TYPING_GRACE_MS,
} from '@/lib/utils/tradeFormat';

import {
  TokenPanelProvider,
  useTokenPanelContext,
} from '@/lib/context/providers/Panels';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { clearFSMTraceFromMemory } from '@/components/debug/FSMTracePanel';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import {
  defaultMissingImage,
  getTokenLogoURL,
} from '@/lib/context/helpers/assetHelpers';

const DEBUG =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_CONTAINER === 'true';
const debugLog = createDebugLogger('TradeAssetPanel', DEBUG, false);

// SELL-only container type for this module
type ContainerType = SP_COIN_DISPLAY.SELL_SELECT_PANEL;

// Static label for this staking panel
const STAKING_LABEL = 'Your staking Amount:';

// ──────────────────────────────────────────────────────────────────────────────
// Embedded SpCoinComponent (SELL side only)
// ──────────────────────────────────────────────────────────────────────────────

const DROPDOWN_LOG_TIME = false;
const DROPDOWN_DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_TOKEN_SELECT_DROP_DOWN === 'true';
const dropdownDebugLog = createDebugLogger(
  'SpCoinComponent',
  DROPDOWN_DEBUG_ENABLED,
  DROPDOWN_LOG_TIME,
);

function SpCoinComponent() {
  // SELL side only for this module
  const sellHook = useSellTokenContract();
  // buyHook kept only so hooks match across app (not used here)
  useBuyTokenContract(); // eslint-disable-line @typescript-eslint/no-unused-vars

  const [tokenContract] = sellHook;

  const { openSellList } = usePanelTransitions();
  const { isVisible } = usePanelTree();

  // Guard against re-entrancy + help diagnose "flash close"
  const lastOpenAtRef = useRef<number | null>(null);
  const openingRef = useRef(false);

  const logoURL = useMemo(() => {
    if (!tokenContract) return defaultMissingImage;

    const raw = tokenContract.logoURL?.trim();

    // If this is an absolute remote URL, respect it as-is.
    if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      return raw;
    }

    // For local assets, derive the path from address + chainId so that
    // case-normalization (UPPERCASE dirs) stays consistent with assetHelpers.
    if (tokenContract.address && typeof tokenContract.chainId === 'number') {
      return getTokenLogoURL({
        address: tokenContract.address,
        chainId: tokenContract.chainId,
      });
    }

    // Fallback: normalize any other non-empty relative path.
    if (raw && raw.length > 0) {
      return raw.startsWith('/') ? raw : `/${raw.replace(/^\/+/, '')}`;
    }

    return defaultMissingImage;
  }, [tokenContract]);

  const handleMissingLogoURL = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget;
      img.onerror = null;
      img.src = defaultMissingImage;
      if (tokenContract?.symbol && tokenContract?.address) {
        dropdownDebugLog.log?.(
          `⚠️ Missing logo for ${tokenContract.symbol} (${tokenContract.address})`,
        );
      } else {
        dropdownDebugLog.log?.(
          '⚠️ Missing logo (no tokenContract info available)',
        );
      }
    },
    [tokenContract],
  );

  // stop bubbling for mousedown and click; some “outside close” handlers listen on either
  const stopMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  const stopClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Post-open visibility probes to catch "flash close"
  const schedulePostChecks = useCallback(
    (panel: SP_COIN_DISPLAY) => {
      const t0 = performance.now();
      const check = (label: string) => {
        const now = performance.now();
        const v = isVisible(panel);
        const sellV = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
        const buyV = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
        dropdownDebugLog.log?.(
          `[post-check:${label}] +${Math.round(
            now - (lastOpenAtRef.current ?? t0),
          )}ms { panel=${SP_COIN_DISPLAY[panel]}, sell=${sellV}, buy=${buyV} }`,
        );
        // If we see it already closed within 250ms, warn loudly
        if (!v && now - (lastOpenAtRef.current ?? t0) < 300) {
          dropdownDebugLog.warn?.(
            `⚠️ Detected early close ("flash"): ${
              SP_COIN_DISPLAY[panel]
            } closed within ${Math.round(
              now - (lastOpenAtRef.current ?? t0),
            )}ms`,
          );
        }
      };

      // Do a couple of quick samples
      setTimeout(() => check('0ms'), 0);
      setTimeout(() => check('150ms'), 150);
      setTimeout(() => {
        openingRef.current = false;
        check('400ms');
      }, 400);
    },
    [isVisible],
  );

  const openTokenSelectPanel = useCallback(
    (e?: React.SyntheticEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // If we’re already in the middle of opening due to rapid double-clicks, ignore
      if (openingRef.current) {
        dropdownDebugLog.log?.(
          '⏳ Ignoring re-entrant open while a previous open is in-flight',
        );
        return;
      }

      clearFSMTraceFromMemory();

      const methodName = 'SpCoinComponent:openTokenSelectPanel';
      openingRef.current = true;
      lastOpenAtRef.current = performance.now();

      // SELL list only for this module
      openSellList({ methodName });
      schedulePostChecks(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);

      // Immediate snapshot after open
      const sellNow = isVisible(SP_COIN_DISPLAY.SELL_LIST_SELECT_PANEL);
      const buyNow = isVisible(SP_COIN_DISPLAY.BUY_LIST_SELECT_PANEL);
      dropdownDebugLog.log?.(
        `openTokenSelectPanel → visible now { sell: ${sellNow}, buy: ${buyNow} }`,
      );
    },
    [openSellList, isVisible, schedulePostChecks],
  );

  function displaySymbol(token: TokenContract) {
    if (DROPDOWN_DEBUG_ENABLED) {
      const msg = stringifyBigInt(token);
      dropdownDebugLog.log?.('[SpCoinComponent] tokenContract', msg);
    }
    return token.symbol ?? 'Select Token';
  }

  return (
    <div
      id='SpCoinComponent'
      className={styles.assetSelect}
      onClick={stopClick}
      onMouseDown={stopMouseDown}
      data-panel-root='sell'
    >
      {tokenContract ? (
        <>
          <img
            id='SpCoinComponentImage.png'
            className='h-9 w-9 mr-2 rounded-md cursor-pointer'
            alt={`${
              tokenContract.name ?? tokenContract.symbol ?? 'token'
            } logo`}
            src={logoURL}
            loading='lazy'
            decoding='async'
            onMouseDown={stopMouseDown}
            onClick={openTokenSelectPanel}
            onError={handleMissingLogoURL}
            data-testid='token-dropdown-avatar'
          />
          {displaySymbol(tokenContract)}
        </>
      ) : (
        <>Select Token:</>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TradeAssetPanel (SELL-only inner + wrapper)
// ──────────────────────────────────────────────────────────────────────────────

function TradeAssetPanelInner() {
  const { exchangeContext, setSellBalance } = useExchangeContext();

  const activeAccountAddr = exchangeContext.accounts?.activeAccount
    ?.address as Address | undefined;

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount(); // still passed into useTokenSelection
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();

  const {
    setLocalTokenContract,
    setLocalAmount,
    containerType: containerTypeRoot,
  } = useTokenPanelContext();

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

  // amount input
  const [inputValue, setInputValue] = useState('0');
  const debouncedSell = useDebounce(sellAmount, 600);
  const debouncedBuy = useDebounce(buyAmount, 600); // still passed downstream

  const typingUntilRef = useRef(0);
  const currentAmount = sellAmount;

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
  const debouncedForPanel = debouncedSell;

  useEffect(() => {
    const correctDirection =
      tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT;
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
  }, [debouncedForPanel, tradeDirection, tokenAddr, containerTypeRoot]);

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

      // SELL-only semantics
      if (tradeDirection !== TRADE_DIRECTION.SELL_EXACT_OUT) {
        setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
      }
      if (sellAmount !== bi) setSellAmount(bi);
    } catch (e) {
      debugLog.warn('parseUnits failed', e);
    }
  };

  // Static staking label
  const buySellText = STAKING_LABEL;

  // ────────────────────────────────────────────────────────────────────────────
  // Balance owner
  // ────────────────────────────────────────────────────────────────────────────
  const hasBalanceOwner = Boolean(activeAccountAddr);

  const {
    balance: rawBalance,
    decimals: balanceDecimals,
    formatted: hookFormatted,
    isLoading: balanceLoading,
    error: balanceError,
  } = useGetBalance({
    tokenAddress: tokenContract?.address as Address | undefined,
    userAddress: activeAccountAddr,
    decimalsHint: tokenDecimals,
    // Let useGetBalance self-gate based on user + chain + token
    staleTimeMs: 20_000,
  });

  // 🧮 Human-readable balance text for the UI
  let formattedBalance: string;
  if (!tokenAddr) {
    // No asset selected → no balance to show
    formattedBalance = '—';
  } else if (!hasBalanceOwner) {
    // Token chosen but no owner yet (initial load / context not ready)
    formattedBalance = '—';
  } else if (balanceError) {
    formattedBalance = '—';
  } else if (balanceLoading) {
    formattedBalance = '…';
  } else {
    formattedBalance = hookFormatted ?? '0.0';
  }

  // 🔁 Push live balance into ExchangeContext (only when stable / non-loading / no error)
  const prevPushedBalanceRef = useRef<bigint | undefined>(undefined);
  useEffect(() => {
    if (!tokenAddr || !activeAccountAddr) return;
    if (balanceLoading || balanceError) return;
    if (rawBalance == null || (balanceDecimals ?? tokenDecimals) == null)
      return;

    let parsed: bigint | undefined;
    try {
      // rawBalance is already bigint, so we just pass it through
      parsed = rawBalance;
    } catch {
      return;
    }

    if (prevPushedBalanceRef.current === parsed) return; // avoid spam
    prevPushedBalanceRef.current = parsed;

    debugLog.log('balance sync', {
      side: 'SELL',
      tokenAddr,
      liveFormattedBalance: hookFormatted,
      parsed: String(parsed),
      prevBal:
        exchangeContext?.tradeData?.sellTokenContract?.balance?.toString?.(),
    });

    setSellBalance?.(parsed);
  }, [
    activeAccountAddr,
    tokenAddr,
    rawBalance,
    balanceDecimals,
    tokenDecimals,
    hookFormatted,
    balanceLoading,
    balanceError,
    setSellBalance,
    exchangeContext?.tradeData?.sellTokenContract?.balance,
  ]);

  const isInputDisabled = !tokenAddr;

  const noAutofillName = useMemo(
    () => `no-autofill-${Math.random().toString(36).slice(2)}`,
    [],
  );

  return (
    <div
      id='TradeAssetPanelInner'
      className={clsx(
        'relative mt-[5px] mb-[5px]',
        'rounded-[12px] overflow-hidden',
      )}
    >
      <input
        id='TokenPanelInputAmount'
        className={clsx(
          'w-full h-[106px] indent-[10px] pt-[10px]',
          'bg-[#1f2639] text-[#94a3b8] text-[25px]',
          'border-0 outline-none focus:outline-none',
          'rounded-b-[12px]',
        )}
        placeholder='0'
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => onChangeAmount(e.target.value)}
        onBlur={() => {
          const n = parseFloat(inputValue);
          setInputValue(clampDisplay(isNaN(n) ? '0' : String(n), 10));
        }}
        name={noAutofillName}
        autoComplete='off'
        autoCorrect='off'
        autoCapitalize='none'
        spellCheck={false}
        inputMode='decimal'
        aria-autocomplete='none'
        data-lpignore='true'
        data-1p-ignore='true'
        data-form-type='other'
      />

      {/* Invisible decoy for autofill managers */}
      <input
        type='text'
        autoComplete='new-password'
        tabIndex={-1}
        aria-hidden='true'
        className='absolute opacity-0 h-0 w-0 pointer-events-none'
      />

      <SpCoinComponent />

      {/* Text row: static staking label */}
      <div className='absolute top-5 left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1'>
        {buySellText}
      </div>

      <div className='absolute top-[74px] right-5 min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1'>
        Balance: {formattedBalance}
      </div>
    </div>
  );
}

function TradeAssetPanel({ containerType }: { containerType: ContainerType }) {
  return (
    <TokenPanelProvider containerType={containerType}>
      <TradeAssetPanelInner />
    </TokenPanelProvider>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TradingSpCoinPanel root (SELL-only)
// ──────────────────────────────────────────────────────────────────────────────

export default function TradingSpCoinPanel() {
  const { isVisible } = usePanelTree();
  const stakingPanelVisible = isVisible(SP_COIN_DISPLAY.MANAGE_STAKING_SPCOINS_PANEL);
  if (!stakingPanelVisible) return null;

  // SELL-select-only for this module
  return (
    <TradeAssetPanel containerType={SP_COIN_DISPLAY.SELL_SELECT_PANEL} />
  );
}
