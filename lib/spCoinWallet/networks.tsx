'use client';

import React from 'react';

import { useAppChainId, useExchangeContext } from '@/lib/context/hooks';
import { toggleShowTestNetsUpdater } from '@/lib/utils/network';
import { useNetworkOptions } from '@/components/views/Buttons/Connect/hooks/useNetworkOptions';

export default function Networks() {
  const [appChainId, setAppChainId] = useAppChainId();
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { mainnetOptions, testnetOptions } = useNetworkOptions();
  const showTestNets = Boolean(exchangeContext?.settings?.showTestNets);

  const renderOption = (opt: { id: number; name: string; symbol: string; logo?: string }) => {
    const active = appChainId === opt.id;
    const isHardhat = /hardhat/i.test(opt.name) || /^HH/i.test(opt.symbol);
    const displayName = isHardhat ? 'Hardhat - (Direct)' : `${opt.name} (Metamask)`;

    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => setAppChainId(opt.id)}
        className={[
          'grid w-full grid-cols-[36px_1fr] items-center gap-3 border-b border-slate-700/70 px-5 py-2 text-left transition-colors',
          active ? 'bg-[#273250]' : 'hover:bg-slate-700/50',
        ].join(' ')}
      >
        {opt.logo ? (
          <img
            src={opt.logo}
            alt={opt.name}
            className="h-10 w-10 rounded-lg object-contain"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-white/20" />
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">{opt.symbol}</span>
          <span className="block truncate font-mono text-[13px] text-slate-300">{displayName}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-slate-700/70">
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        {mainnetOptions.map(renderOption)}
        {showTestNets ? testnetOptions.map(renderOption) : null}
      </div>
      <label className="flex shrink-0 items-center justify-between border-t border-slate-700/70 px-5 py-3 text-sm text-slate-300">
        <span>Show Test Nets</span>
        <input
          type="checkbox"
          checked={showTestNets}
          onChange={() =>
            setExchangeContext(
              toggleShowTestNetsUpdater,
              'Networks:onToggleShowTestNets',
            )
          }
          className="h-4 w-4 cursor-pointer accent-[#5981F3]"
        />
      </label>
    </div>
  );
}
