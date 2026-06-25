'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';
import { clsx } from 'clsx';
import { ChevronDown, Copy, Check } from 'lucide-react';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useSellTokenContract, useExchangeContext } from '@/lib/context/hooks';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import PanelGate from '@/components/utility/PanelGate';

type SendSelectPanelProps = {
  amount: string;
  onAmountChange: (value: string) => void;
};

export default function SendSelectPanel({ amount, onAmountChange }: SendSelectPanelProps) {
  return (
    <div id="SEND_SELECT_PANEL">
      <SendSelectPanelInner amount={amount} onAmountChange={onAmountChange} />
    </div>
  );
}

function SendSelectPanelInner({ amount, onAmountChange }: SendSelectPanelProps) {
  const { exchangeContext } = useExchangeContext();
  const [sellTokenContract] = useSellTokenContract();
  const nativeToken = useNativeToken();
  const { openPanel, closePanel } = usePanelTree();
  const tokenAddressVisible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_ADDRESS_COMPONENT);
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);
  const [copied, setCopied] = useState(false);

  const handleChevronClick = useCallback(() => {
    if (walletAccountsVisible) {
      closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'SendSelectPanel:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'SendSelectPanel:chevron:open');
    }
  }, [walletAccountsVisible, openPanel, closePanel]);

  const activeAccountAddr = exchangeContext.accounts?.activeAccount?.address as Address | undefined;

  // Use sell token as the "send" token, fall back to native
  const token = sellTokenContract ?? nativeToken;
  const tokenAddr = token?.address as Address | undefined;
  const tokenDecimals = token?.decimals ?? 18;
  const chainId = typeof token?.chainId === 'number' ? token.chainId : undefined;
  const tokenSymbol = token?.symbol ?? 'Token';

  // Reset amount when token changes
  const prevAddrRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevAddrRef.current !== tokenAddr) {
      prevAddrRef.current = tokenAddr;
      onAmountChange('0');
    }
  }, [tokenAddr, onAmountChange]);

  // Balance via balanceOf
  const {
    formatted: formattedBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useGetBalance({
    tokenAddress: tokenAddr,
    userAddress: activeAccountAddr,
    decimalsHint: tokenDecimals,
    staleTimeMs: 20_000,
  });

  const balanceText = !tokenAddr
    ? '—'
    : !activeAccountAddr
    ? '—'
    : balanceError
    ? '—'
    : balanceLoading
    ? '…'
    : (formattedBalance ?? '0.0');

  // Token logo
  const logoURL = useMemo(() => {
    if (!token) return defaultMissingImage;
    const raw = token.logoURL?.trim();
    if (raw?.startsWith('http://') || raw?.startsWith('https://')) return raw;
    if (token.address && typeof token.chainId === 'number') {
      return getTokenLogoURL({ address: token.address, chainId: token.chainId });
    }
    return defaultMissingImage;
  }, [token]);

  const handleLogoError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultMissingImage;
  }, []);

  const stop = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);

  const handleSymbolClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (tokenAddressVisible) {
      closePanel(SP_COIN_DISPLAY.TOKEN_ADDRESS_COMPONENT, 'SendSelectPanel:symbolClick:close');
    } else {
      openPanel(SP_COIN_DISPLAY.TOKEN_ADDRESS_COMPONENT, 'SendSelectPanel:symbolClick:open');
    }
  }, [tokenAddressVisible, openPanel, closePanel]);

  const openTokenList = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    openPanel(
      SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL,
      'SendSelectPanel:openTokenList',
      SP_COIN_DISPLAY.SELL_CONTRACT,
    );
  }, [openPanel]);

  const noAutofillName = useMemo(
    () => `no-autofill-send-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const truncateMiddle = (addr: string, start = 10, end = 8) =>
    addr.length > start + end + 3 ? `${addr.slice(0, start)}...${addr.slice(-end)}` : addr;

  const onChangeAmount = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    onAmountChange(value.replace(/^0+(?!\.)/, '') || '0');
  };

  return (
    <div className={clsx('rounded-[12px] overflow-hidden bg-[#1f2639]')}>
    <div className="relative">
      <input
        className={clsx(
          'w-full h-[106px] indent-[10px] pt-[10px]',
          'bg-[#1f2639] text-[#94a3b8] text-[25px]',
          'border-0 outline-none focus:outline-none',
          'rounded-b-[12px]',
        )}
        placeholder="0"
        value={amount}
        onChange={(e) => onChangeAmount(e.target.value)}
        onBlur={() => {
          const n = parseFloat(amount);
          onAmountChange(isNaN(n) ? '0' : String(n));
        }}
        name={noAutofillName}
        autoComplete="off"
        inputMode="decimal"
        aria-label="Send amount"
      />

      {/* Token dropdown */}
      <div className={styles.assetSelect} onClick={stop} onMouseDown={stop}>
        {token ? (
          <>
            <img
              className="h-9 w-9 mr-2 rounded-md cursor-pointer"
              alt={tokenSymbol}
              title={`Sending ${tokenSymbol}`}
              src={logoURL}
              loading="lazy"
              decoding="async"
              onError={handleLogoError}
            />
            <span
            className="cursor-pointer hover:text-white transition-colors"
            title={tokenAddressVisible ? 'Hide token address' : 'Show token address'}
            onClick={handleSymbolClick}
          >
            {tokenSymbol}
          </span>
</>
        ) : (
          <>Select Token:</>
        )}
        <span
          className="ml-2 inline-flex cursor-pointer"
          title="Select token to send"
          onMouseDown={stop}
          onClick={openTokenList}
        >
          <ChevronDown id="SendChevronDown" size={18} />
        </span>
      </div>

      {/* Send label */}
      <div className="absolute top-5 left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        You are Sending:
      </div>

      {/* Balance */}
      <div className="absolute top-[74px] left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] flex items-center gap-1">
        Balance: {balanceText}
      </div>
    </div>

    <PanelGate panel={SP_COIN_DISPLAY.SEND_ADDRESS_HEADER_BAR}>
      <div className="flex items-center gap-2 px-[10px] py-2">
        <span className="shrink-0 text-[#94a3b8] text-[12px]">To:</span>
        {exchangeContext.accounts?.activeAccount?.logoURL ? (
          <button
            type="button"
            onClick={() => openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'SendSelectPanel:logo:openAccountPanel')}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A] hover:opacity-80 transition-opacity"
            title="View account details"
          >
            <img
              src={exchangeContext.accounts.activeAccount.logoURL}
              alt=""
              className="h-full w-full object-contain"
            />
          </button>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-[22px] bg-[#243056] px-1 py-1 text-[15px] text-[#5981F3]">
          <span className="w-full whitespace-nowrap text-center font-mono cursor-default select-all">
            {activeAccountAddr ? truncateMiddle(activeAccountAddr) : '—'}
          </span>
          <button
            type="button"
            onClick={handleChevronClick}
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
            aria-label={walletAccountsVisible ? 'Hide accounts' : 'Show accounts'}
          >
            <ChevronDown className={[
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              walletAccountsVisible ? 'rotate-180' : '',
            ].join(' ')} />
          </button>
        </div>
        <button
          type="button"
          className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
          aria-label="Copy address"
          title="Copy address"
          onClick={() => {
            if (!activeAccountAddr) return;
            navigator.clipboard.writeText(activeAccountAddr).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied
            ? <Check className="h-5 w-5 text-green-400" />
            : <Copy className="h-5 w-5 text-slate-400" />
          }
        </button>
      </div>
    </PanelGate>
    </div>
  );
}
