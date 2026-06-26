'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Address } from 'viem';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

import styles from '@/styles/Exchange.module.css';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { useSendTokenContract, useExchangeContext } from '@/lib/context/hooks';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { useGetBalance } from '@/lib/hooks/useGetBalance';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import TokenLogo from '@/components/utility/TokenLogo';

type SendSelectPanelProps = {
  amount: string;
  onAmountChange: (value: string) => void;
};

export default function SendSelectPanel({ amount, onAmountChange }: SendSelectPanelProps) {
  const { exchangeContext } = useExchangeContext();
  const [sendTokenContract] = useSendTokenContract();
  const nativeToken = useNativeToken();
  const { openPanel } = usePanelTree();

  const activeAccountAddr = exchangeContext.accounts?.activeAccount?.address as Address | undefined;

  const token = sendTokenContract ?? nativeToken;
  const tokenAddr = token?.address as Address | undefined;
  const tokenDecimals = token?.decimals ?? 18;
  const tokenSymbol = token?.symbol ?? 'Token';

  const prevAddrRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevAddrRef.current !== tokenAddr) {
      prevAddrRef.current = tokenAddr;
      onAmountChange('0');
    }
  }, [tokenAddr, onAmountChange]);

  const { formatted: formattedBalance, isLoading: balanceLoading, error: balanceError } = useGetBalance({
    tokenAddress: tokenAddr,
    userAddress: activeAccountAddr,
    decimalsHint: tokenDecimals,
    staleTimeMs: 20_000,
  });

  const balanceText = !tokenAddr ? '—'
    : !activeAccountAddr ? '—'
    : balanceError ? '—'
    : balanceLoading ? '…'
    : (formattedBalance ?? '0.0');

  const logoURL = useMemo(() => {
    if (!token) return defaultMissingImage;
    const raw = token.logoURL?.trim();
    if (raw?.startsWith('http://') || raw?.startsWith('https://')) return raw;
    if (token.address && typeof token.chainId === 'number') {
      return getTokenLogoURL({ address: token.address, chainId: token.chainId });
    }
    return defaultMissingImage;
  }, [token]);

  const stop = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);

  const openTokenList = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    openPanel(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, 'SendSelectPanel:openTokenList', SP_COIN_DISPLAY.SEND_CONTRACT);
  }, [openPanel]);

  const noAutofillName = useMemo(() => `no-autofill-send-${Math.random().toString(36).slice(2)}`, []);

  const onChangeAmount = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    onAmountChange(value.replace(/^0+(?!\.)/, '') || '0');
  };

  return (
    <div id="SEND_SELECT_PANEL" className="relative">
      <input
        className={clsx(
          'w-full h-[91px] indent-[10px] pt-[10px]',
          'bg-[#1f2639] text-[#94a3b8] text-[25px]',
          'border-0 outline-none focus:outline-none',
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

      <div className={styles.assetSelect} onClick={stop} onMouseDown={stop}>
        {token ? (
          <>
            <TokenLogo
              logoURL={logoURL}
              symbol={token?.symbol}
              name={token?.name}
              address={tokenAddr}
              chainId={token?.chainId}
              className="h-9 w-9 mr-2 rounded-md"
            />
            <span className="cursor-default select-none" title={tokenAddr ?? ''}>
              {tokenSymbol}
            </span>
          </>
        ) : (
          <>Select Token:</>
        )}
        <span className="ml-2 inline-flex cursor-pointer" title="Select token to send" onMouseDown={stop} onClick={openTokenList}>
          <ChevronDown id="SendChevronDown" size={18} />
        </span>
      </div>

      <div title="Tokens You are Sending" className="absolute top-5 left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        Tokens You are Sending:
      </div>

      <div className="absolute top-[74px] right-[10px] h-[10px] text-[#94a3b8] text-[12px] flex items-center gap-1">
        Balance: {balanceText}
      </div>
    </div>
  );
}
