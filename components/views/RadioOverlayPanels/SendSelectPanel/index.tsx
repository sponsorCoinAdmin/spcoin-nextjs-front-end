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
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import PanelGate from '@/components/utility/PanelGate';
import AccountAvatar from '@/components/utility/AccountAvatar';
import TokenLogo from '@/components/utility/TokenLogo';
import { truncateMiddle } from '@/lib/utils/addressUtils';

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
  const [sendTokenContract] = useSendTokenContract();
  const nativeToken = useNativeToken();
  const { openPanel, closePanel } = usePanelTree();
  const recipientPickerVisible = usePanelVisible(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL);

  const handleChevronClick = useCallback(() => {
    if (recipientPickerVisible) {
      closePanel(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL, 'SendSelectPanel:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.SEND_RECIPIENT_SELECT_PANEL, 'SendSelectPanel:chevron:open');
    }
  }, [recipientPickerVisible, openPanel, closePanel]);

  const activeAccountAddr = exchangeContext.accounts?.activeAccount?.address as Address | undefined;
  const toAddress = (exchangeContext.accounts?.sendRecipientAddress ?? '') as string;
  const recipientLogoURL = (exchangeContext.accounts?.sendRecipientLogoURL as string | undefined) ?? defaultMissingImage;

  const token = sendTokenContract ?? nativeToken;
  const tokenAddr = token?.address as Address | undefined;
  const tokenDecimals = token?.decimals ?? 18;
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

  const stop = useCallback((e: React.MouseEvent) => { e.stopPropagation(); }, []);

  const openTokenList = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    openPanel(
      SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL,
      'SendSelectPanel:openTokenList',
      SP_COIN_DISPLAY.SEND_CONTRACT,
    );
  }, [openPanel]);

  const noAutofillName = useMemo(
    () => `no-autofill-send-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const onChangeAmount = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    onAmountChange(value.replace(/^0+(?!\.)/, '') || '0');
  };

  return (
    <div className={clsx('rounded-[12px] overflow-hidden bg-[#1f2639]')}>
    <div className="relative">
      <input
        className={clsx(
          'w-full h-[91px] indent-[10px] pt-[10px]',
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
            <TokenLogo
              logoURL={logoURL}
              symbol={token?.symbol}
              name={token?.name}
              address={tokenAddr}
              chainId={token?.chainId}
              className="h-9 w-9 mr-2 rounded-md"
            />
            <span
              className="cursor-default select-none"
              title={tokenAddr ?? ''}
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
      <div title="Tokens You are Sending" className="absolute top-5 left-[10px] min-w-[50px] h-[10px] text-[#94a3b8] text-[12px] pr-2 flex items-center gap-1">
        Tokens You are Sending:
      </div>

      {/* Balance */}
      <div className="absolute top-[74px] right-[10px] h-[10px] text-[#94a3b8] text-[12px] flex items-center gap-1">
        Balance: {balanceText}
      </div>
    </div>

    <PanelGate panel={SP_COIN_DISPLAY.SEND_ADDRESS_HEADER_BAR}>
      <div className="flex items-center gap-2 px-[10px] pt-1 pb-2">
        <span title="To Recipient" className="shrink-0 text-[#94a3b8] text-[12px]">To Recipient:</span>
        <div className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg hover:opacity-80 transition-opacity">
          <AccountAvatar
            logoURL={toAddress ? recipientLogoURL : undefined}
            address={toAddress || undefined}
            className="h-full w-full object-contain"
          />
        </div>
        <div
          className="flex h-[25px] items-center gap-[5px] rounded-full bg-[#243056] px-3 text-white font-bold"
          title={toAddress || ''}
        >
          <span className="whitespace-nowrap font-mono cursor-default select-all text-[17px]">
            {toAddress ? truncateMiddle(toAddress, 4, 4) : <span className="text-slate-400 italic font-normal text-[17px]">Select recipient…</span>}
          </span>
          <button
            type="button"
            onClick={handleChevronClick}
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
            aria-label={recipientPickerVisible ? 'Close recipient picker' : 'Open recipient picker'}
          >
            <ChevronDown className={[
              'h-4 w-4 text-slate-400 transition-transform duration-200',
              recipientPickerVisible ? 'rotate-180' : '',
            ].join(' ')} />
          </button>
        </div>
      </div>
    </PanelGate>
    </div>
  );
}
