// File: components/Buttons/ConnectButton.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useSwitchChain, useDisconnect, useChainId } from 'wagmi';
import connectTheme from '@/styles/connectTheme.json';
import networks from '@/lib/network/initialize/networks.json';
import { useAppChainId } from '@/lib/context/hooks';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';

export default function ConnectButton() {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  const { switchChainAsync, isPending } = useSwitchChain();
  const { disconnect } = useDisconnect();

  const walletChainId = useChainId();
  const [appChainId, setAppChainId] = useAppChainId();

  useEffect(() => {
    if (typeof walletChainId === 'number' && walletChainId !== appChainId) {
      setAppChainId(walletChainId);
    }
  }, [walletChainId, appChainId, setAppChainId]);

  // close dropdown on Escape/outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!listRef.current) return;
      if (!listRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [open]);

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
    setAppChainId(targetId);
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
        // --- DISCONNECTED ---
        if (!isConnected) {
          return <ConnectKitButton customTheme={connectTheme as any} />;
        }

        // --- CONNECTED ---
        const currentId =
          chain?.id ??
          appChainId ??
          (typeof walletChainId === 'number' ? walletChainId : undefined);

        return (
          <div className="relative m-1">
            <button
              onClick={() => setOpen((v) => !v)}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              title={isPending ? 'Switching…' : 'Select network'}
              className={`
                bg-connect-bg text-connect-color rounded-lg px-3 py-1.5
                flex items-center gap-2 text-sm outline-none border border-transparent
                hover:bg-connect-hover-bg hover:text-connect-hover-color
                focus:ring-2 focus:ring-offset-0 focus:ring-focus-ring
              `}
            >
              {typeof currentId === 'number' && (
                <img
                  src={`/assets/blockchains/${currentId}/info/network.png`}
                  alt="Network"
                  className="h-8 w-8 rounded"
                />
              )}
              <span className="opacity-85">{truncatedAddress ?? address}</span>
              <span className="text-xs opacity-75">
                {isPending ? 'Switching…' : '▼'}
              </span>
            </button>

            {open && (
              <ul
                ref={listRef}
                role="menu"
                className="absolute right-0 mt-2 w-72 rounded-lg border shadow-2xl p-1.5 z-50
                           bg-panel-bg border-panel-border text-panel-text"
              >
                {options.map((opt) => {
                  const isCurrent = currentId === opt.id;
                  return (
                    <li key={opt.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={isPending}
                        onClick={() => switchTo(opt.id, isConnected)}
                        className={`
                          w-full flex items-center gap-2 px-2.5 py-2 rounded-md
                          transition-colors text-panel-text disabled:opacity-50
                          hover:bg-panel-hover-bg ${isCurrent ? 'bg-panel-hover-bg' : ''}
                        `}
                      >
                        <img src={opt.logo} alt={opt.name} className="h-8 w-8 rounded" />
                        <div className="flex-1 text-left">
                          <div className="leading-tight">{opt.name}</div>
                          <div className="text-xs opacity-75">
                            {opt.symbol} • Chain ID {opt.id}
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-xs opacity-75">Current</span>
                        )}
                      </button>
                    </li>
                  );
                })}

                <li className="mt-1 pt-1 border-t border-panel-border" role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={doDisconnect}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md
                               transition-colors text-panel-text hover:bg-panel-hover-bg"
                  >
                    <span className="text-lg">🔌</span>
                    <span>Disconnect</span>
                  </button>
                </li>

                <li className="mt-1 pt-1 border-t border-panel-border" role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      show?.();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md
                               transition-colors text-panel-text hover:bg-panel-hover-bg"
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
