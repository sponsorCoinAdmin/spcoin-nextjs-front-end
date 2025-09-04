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

  // NOTE: Removed wallet↔app sync useEffect here to prevent update loops.
  // Syncing is handled centrally in ExchangeProvider/useAppChainId.

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
        // --- DISCONNECTED (unchanged look/behavior) ---
        if (!isConnected) {
          const fallbackId = options[0]?.id;
          const currentId =
            (typeof appChainId === 'number' && appChainId > 0 ? appChainId : undefined) ??
            (typeof walletChainId === 'number' && walletChainId > 0 ? walletChainId : undefined) ??
            fallbackId;

          return (
            <div className="relative m-0">
              <div
                className={`
                  bg-connect-bg text-connect-color font-bold rounded-lg px-3 py-1.5
                  flex items-center gap-2 text-sm border-0
                  hover:bg-connect-hover-bg hover:text-connect-hover-color
                  focus-within:ring-0
                `}
              >
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className="flex items-center outline-none"
                >
                  {typeof currentId === 'number' && (
                    <img
                      src={`/assets/blockchains/${currentId}/info/network.png`}
                      alt="Network"
                      className="h-8 w-8 rounded"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => show?.()}
                  className="font-bold text-base opacity-90 outline-none"
                >
                  Connect
                </button>
              </div>

              {open && (
                <ul
                  ref={listRef}
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full w-72 rounded-lg p-0 z-50
                             bg-panel-bg text-panel-text shadow-none"
                >
                  {options.map((opt) => {
                    const isCurrent = currentId === opt.id;
                    return (
                      <li key={opt.id} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => switchTo(opt.id, false)}
                          className={`
                            w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                            transition-colors text-panel-text
                            hover:bg-panel-hover-bg ${isCurrent ? 'bg-panel-hover-bg' : ''}
                          `}
                        >
                          <img src={opt.logo} alt={opt.name} className="h-8 w-8 rounded" />
                          <div className="flex-1 text-left">
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
          );
        }

        // --- CONNECTED (network name on button; address row first; chevron shown) ---
        const currentId =
          chain?.id ??
          appChainId ??
          (typeof walletChainId === 'number' ? walletChainId : undefined);

        const currentName =
          (typeof currentId === 'number' &&
            options.find((o) => o.id === currentId)?.name) ||
          chain?.name ||
          (typeof currentId === 'number' ? `Chain ${currentId}` : 'Select Network');

        return (
          <div className="relative m-0">
            <button
              onClick={() => setOpen((v) => !v)}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              className={`
                bg-connect-bg text-connect-color font-bold rounded-lg px-3 py-1.5
                flex items-center gap-2 text-sm outline-none border-0
                hover:bg-connect-hover-bg hover:text-connect-hover-color
                focus:ring-0
              `}
            >
              {typeof currentId === 'number' && (
                <img
                  src={`/assets/blockchains/${currentId}/info/network.png`}
                  alt="Network"
                  className="h-8 w-8 rounded"
                />
              )}
              <span className="opacity-85 font-bold">{currentName}</span>
              <span className="text-xs opacity-75 font-bold">▼</span>
            </button>

            {open && (
              <ul
                ref={listRef}
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 top-full w-72 rounded-lg p-0 z-50
                           bg-panel-bg text-panel-text shadow-none"
              >
                {/* Address row — presentational (non-interactive) */}
                <li role="presentation">
                  <div
                    role="presentation"
                    className={`
                      w-full flex items-center gap-2 px-2.5 py-2 rounded-md
                      text-panel-text font-bold select-text cursor-default
                    `}
                  >
                    {typeof currentId === 'number' && (
                      <img
                        src={`/assets/blockchains/${currentId}/info/network.png`}
                        alt=""               /* decorative */
                        aria-hidden="true"   /* not focusable/announced */
                        className="h-6 w-6 rounded"
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-xs opacity-75 font-bold">Address</div>
                      <div className="leading-tight font-bold">
                        {truncatedAddress ?? address}
                      </div>
                    </div>
                  </div>
                </li>

                {/* Network options */}
                {options.map((opt) => {
                  const isCurrent = currentId === opt.id;
                  return (
                    <li key={opt.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={isPending}
                        onClick={() => switchTo(opt.id, true)}
                        className={`
                          w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                          transition-colors text-panel-text disabled:opacity-50
                          hover:bg-panel-hover-bg ${isCurrent ? 'bg-panel-hover-bg' : ''}
                        `}
                      >
                        <img src={opt.logo} alt={opt.name} className="h-8 w-8 rounded" />
                        <div className="flex-1 text-left">
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

                <li className="mt-1 pt-1 border-t border-panel-border" role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      disconnect();
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                               transition-colors text-panel-text hover:bg-panel-hover-bg"
                  >
                    <span className="text-lg">🔌</span>
                    <span className="font-bold">Disconnect</span>
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
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                               transition-colors text-panel-text hover:bg-panel-hover-bg"
                  >
                    <span className="font-bold">Open Wallet Modal…</span>
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
