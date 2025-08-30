// File: components/Buttons/ConnectButton.tsx

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useSwitchChain, useDisconnect, useChainId } from 'wagmi';
import connectTheme from '@/styles/connectTheme.json';
import networks from '@/lib/network/initialize/networks.json';
import { useAppChainId } from '@/lib/context/hooks';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';

export default function ConnectButton() {
  const [open, setOpen] = useState(false);
  const { switchChainAsync, isPending } = useSwitchChain();
  const { disconnect } = useDisconnect();

  // Wallet ↔ App chain sync
  const walletChainId = useChainId();
  const [appChainId, setAppChainId] = useAppChainId();

  useEffect(() => {
    if (typeof walletChainId === 'number' && walletChainId !== appChainId) {
      setAppChainId(walletChainId);
    }
  }, [walletChainId, appChainId, setAppChainId]);

  const options = useMemo(
    () =>
      (networks as any[]).map((n) => ({
        id: Number(n.chainId),
        name: String(n.name ?? ''),
        symbol: String(n.symbol ?? ''),
        logo: n.logoURL ?? getBlockChainLogoURL(Number(n.chainId)),
      })),
    []
  );

  const switchTo = async (targetId: number, isConnected?: boolean) => {
    setAppChainId(targetId); // optimistic app update
    if (!isConnected) return setOpen(false);
    try {
      await switchChainAsync({ chainId: targetId });
    } finally {
      setOpen(false);
    }
  };

  const doDisconnect = () => {
    disconnect();
    setOpen(false);
  };

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, address, truncatedAddress, chain, show }) => {
        if (!isConnected) return <ConnectKitButton customTheme={connectTheme} />;

        const currentId =
          chain?.id ?? appChainId ?? (typeof walletChainId === 'number' ? walletChainId : undefined);

        return (
          <div className="relative m-1">
            <button
              onClick={() => setOpen((v) => !v)}
              className="px-3.5 py-1 rounded-md bg-[#222a3a] text-white hover:opacity-90 flex items-center gap-2 text-base"
              title={isPending ? 'Switching…' : 'Select network'}
              type="button"
            >
              {typeof currentId === 'number' && (
                <img
                  src={`/assets/blockchains/${currentId}/info/network.png`}
                  alt="Network"
                  className="h-8 w-8 rounded"
                />
              )}
              <span className="opacity-70">{truncatedAddress ?? address}</span>
              <span className="text-xs opacity-70">{isPending ? 'Switching…' : '▼'}</span>
            </button>

            {open && (
              <ul className="absolute right-0 mt-2 w-[280px] rounded-md bg-[#1b2232] border border-[#2a3350] shadow-lg p-1 z-50 text-base">
                {options.map((opt) => {
                  const isCurrent = currentId === opt.id;
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => switchTo(opt.id, isConnected)}
                        className={`w-full flex items-center gap-2 px-1.5 py-2 rounded hover:bg-[#2a3350] disabled:opacity-50 ${
                          isCurrent ? 'bg-[#2a3350]' : ''
                        }`}
                      >
                        <img src={opt.logo} alt={opt.name} className="h-8 w-8 rounded" />
                        <div className="flex-1 text-left">
                          <div className="leading-tight">{opt.name}</div>
                          <div className="text-xs opacity-60">
                            {opt.symbol} • Chain ID {opt.id}
                          </div>
                        </div>
                        {isCurrent && <span className="text-xs opacity-70">Current</span>}
                      </button>
                    </li>
                  );
                })}

                <li className="mt-1 pt-1 border-t border-[#2a3350]">
                  <button
                    type="button"
                    onClick={doDisconnect}
                    className="w-full flex items-center gap-2 px-1.5 py-2 text-left rounded hover:bg-[#2a3350]"
                  >
                    <span className="text-lg">🔌</span>
                    <span>Disconnect</span>
                  </button>
                </li>

                <li className="mt-1 pt-1 border-t border-[#2a3350]">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      show?.();
                    }}
                    className="w-full px-1.5 py-2 text-left rounded hover:bg-[#2a3350]"
                  >
                    Open Wallet Modal…
                  </button>
                </li>
              </ul>
            )}
          </div>
        );
      }}
    </ConnectKitButton.Custom>
  );
}
