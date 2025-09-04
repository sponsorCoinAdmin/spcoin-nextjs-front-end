// File: components/Buttons/ConnectButton.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useSwitchChain } from 'wagmi';
import networks from '@/lib/network/initialize/networks.json';
import { useAppChainId } from '@/lib/context/hooks';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';
import { clsx } from 'clsx';

export default function ConnectButton() {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  // App chain (source of truth for your app)
  const [appChainId, setAppChainId] = useAppChainId();

  const appIdNum = useMemo(
    () => (typeof appChainId === 'number' ? appChainId : Number(appChainId)),
    [appChainId]
  );

  const [currentId, setCurrentId] = useState<number | undefined>(
    Number.isFinite(appIdNum) ? appIdNum : undefined
  );
  useEffect(() => {
    if (Number.isFinite(appIdNum)) setCurrentId(appIdNum);
  }, [appIdNum]);

  // Wagmi wallet chain switching (only valid when connected)
  const { switchChainAsync, isPending } = useSwitchChain();

  // Build dropdown options
  const options = useMemo(
    () =>
      (networks as any[]).map((n) => {
        const id = Number(n.chainId);
        return {
          id,
          name: String(n.name ?? ''),
          symbol: String(n.symbol ?? ''),
          logo:
            n.logoURL ??
            getBlockChainLogoURL(id) ??
            `/assets/blockchains/${id}/info/network.png`,
        };
      }),
    []
  );

  // Close on Escape / click-outside
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

  // Selection behavior:
  // - Always update appChainId (UI/source of truth).
  // - If connected, request wallet switch.
  // - If disconnected, remember preference for later.
  const selectNetwork = async (targetId: number, isConnected: boolean | undefined) => {
    // optimistic UI
    setCurrentId(targetId);
    setAppChainId(
      (typeof appChainId === 'string' ? String(targetId) : targetId) as any
    );

    try {
      if (isConnected) {
        await switchChainAsync({ chainId: targetId });
      } else {
        localStorage.setItem('preferredChainId', String(targetId));
      }
    } finally {
      setOpen(false);
    }
  };

  // Resolve current logo robustly
  const currentLogo =
    typeof currentId === 'number'
      ? options.find((o) => o.id === currentId)?.logo ??
        `/assets/blockchains/${currentId}/info/network.png`
      : undefined;

  return (
    <ConnectKitButton.Custom>
      {({ isConnected }) => (
        <div className="relative m-0">
          <button
            onClick={() => setOpen((v) => !v)}
            title={isPending ? 'Switching…' : 'Select network'}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            className={clsx(
              // unified button style
              'bg-connect-bg text-connect-color font-bold rounded-lg px-3 py-1.5',
              'flex items-center gap-2 leading-tight text-sm outline-none border-0',
              'hover:bg-connect-hover-bg hover:text-connect-hover-color',
              'focus:ring-0'
            )}
          >
            {currentLogo && typeof currentId === 'number' && (
              <img
                key={currentId}
                src={`${currentLogo}?v=${currentId}`}
                alt="Network"
                className="h-8 w-8 rounded"
              />
            )}
          </button>

          {open && (
            <ul
              ref={listRef}
              role="menu"
              aria-orientation="vertical"
              className={clsx(
                'absolute right-0 top-full w-72 rounded-lg p-0 z-50',
                // unified panel style
                'bg-panel-bg text-panel-text shadow-none'
              )}
            >
              {options.map((opt) => {
                const isCurrent = currentId === opt.id;
                return (
                  <li key={opt.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => selectNetwork(opt.id, isConnected)}
                      className={clsx(
                        'w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors disabled:opacity-50 focus:outline-none',
                        'text-panel-text hover:bg-panel-hover-bg',
                        isCurrent && 'bg-panel-hover-bg'
                      )}
                    >
                      <img src={opt.logo} alt={opt.name} className="h-8 w-8 rounded" />
                      <div className="flex-1">
                        <div className="leading-tight font-bold">{opt.name}</div>
                        <div className="text-xs opacity-75 font-bold">
                          {opt.symbol} • Chain ID {opt.id}
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-xs opacity-75 font-bold">Current</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </ConnectKitButton.Custom>
  );
}
