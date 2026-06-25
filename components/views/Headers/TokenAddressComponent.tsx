// File: components/views/Headers/TokenAddressComponent.tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { useSellTokenContract } from '@/lib/context/hooks';
import { useNativeToken } from '@/lib/hooks/useNativeToken';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { defaultMissingImage, getTokenLogoURL } from '@/lib/context/helpers/assetHelpers';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';

export default function TokenAddressComponent() {
  const [sellTokenContract] = useSellTokenContract();
  const nativeToken = useNativeToken();
  const { openPanel, closePanel } = usePanelTree();
  const tokenListVisible = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);
  const [copied, setCopied] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);

  const token = sellTokenContract ?? nativeToken;
  const address = String(token?.address ?? '').trim();
  const symbol = token?.symbol ?? '';
  const rawName = (token as any)?.name ?? '';
  const chainId = typeof token?.chainId === 'number' ? token.chainId : undefined;
  const blockchainName = chainId != null ? (getBlockChainName(chainId) ?? '') : '';
  // Some chains return the network name instead of the actual token name (e.g. "Base" instead of "Ethereum").
  // Fall back to a canonical name for well-known native token symbols.
  const CANONICAL_NATIVE_NAMES: Record<string, string> = { ETH: 'Ethereum', BNB: 'BNB', MATIC: 'Polygon', AVAX: 'Avalanche' };
  const name = CANONICAL_NATIVE_NAMES[symbol] ?? rawName;

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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleChevron = useCallback(() => {
    if (tokenListVisible) {
      closePanel(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, 'TokenAddressComponent:chevron:close');
    } else {
      openPanel(
        SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL,
        'TokenAddressComponent:chevron:open',
        SP_COIN_DISPLAY.SELL_CONTRACT,
      );
    }
  }, [tokenListVisible, openPanel, closePanel]);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.TOKEN_ADDRESS_COMPONENT}>
      {/* Collapsible header — mirrors ActiveAccountHeaderBar style */}
      {headerVisible && (
        <div className="relative shrink-0 border-b border-slate-700/50 -mx-4 px-4 py-3 flex flex-col items-center">
          <span className="text-[19px] font-semibold text-[#5981F3]">
            {blockchainName ? `${blockchainName} Network` : 'Network'}
          </span>
          {(symbol || name) && (
            <span className="text-[14px] font-normal text-slate-400">
              {symbol}{name ? `: ${name}` : ''}
            </span>
          )}
        </div>
      )}

      {/* Address row — mirrors ActiveAccount style */}
      <div className="shrink-0 border-b border-slate-700/50 -mx-4 px-4 py-2 flex items-center gap-2 text-sm text-slate-300/80">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
          <img
            src={logoURL}
            alt={symbol || 'Token'}
            className="h-full w-full object-contain"
            onError={handleLogoError}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[22px] bg-[#243056] px-3 py-1 text-[15px] text-[#5981F3]">
          <span
            className="w-full truncate whitespace-nowrap text-center font-mono cursor-pointer"
            title={headerVisible ? 'Hide token info' : 'Show token info'}
            onClick={() => setHeaderVisible((v) => !v)}
          >
            {address || '—'}
          </span>
          <button
            type="button"
            onClick={handleChevron}
            className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 p-0.5"
            aria-label={tokenListVisible ? 'Close token list' : 'Select token'}
          >
            <ChevronDown
              className={[
                'h-4 w-4 text-slate-400 transition-transform duration-200',
                tokenListVisible ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!address}
          className="shrink-0 flex items-center justify-center rounded hover:bg-white/10 pl-0.5 pr-0 disabled:opacity-40"
          aria-label="Copy token contract address"
          title="Copy token contract address"
        >
          {copied
            ? <Check className="h-6 w-6 text-green-400" />
            : <Copy className="h-6 w-6 text-slate-400" />
          }
        </button>
      </div>
    </PanelGate>
  );
}
