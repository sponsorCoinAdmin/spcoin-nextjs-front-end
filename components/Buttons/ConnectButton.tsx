// File: components/Buttons/ConnectButton.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useSwitchChain, useDisconnect, useChainId, useConnect, useConnectors } from 'wagmi';
import networks from '@/lib/network/initialize/networks.json';
import { useAppChainId } from '@/lib/context/hooks';
import { getBlockChainLogoURL } from '@/lib/context/helpers/NetworkHelpers';

type ConnectButtonProps = {
  showName?: boolean;
  showSymbol?: boolean;
  showChevron?: boolean;
  showConnect?: boolean;  // disconnected-only visual; see rules below
  showHoverBg?: boolean;
};

export default function ConnectButton({
  showName = true,
  showSymbol = true,
  showChevron = true,
  showConnect = true,
  showHoverBg = true,
}: ConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  const { switchChainAsync, isPending } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { connectAsync } = useConnect();
  const connectors = useConnectors();

  const walletChainId = useChainId();
  const [appChainId, setAppChainId] = useAppChainId();

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

  // Prefer MetaMask
  const metaMaskConnector = useMemo(() => {
    return (
      connectors.find((c) => c.id === 'metaMask') ||
      connectors.find(
        (c) =>
          c.type === 'injected' &&
          typeof c.name === 'string' &&
          c.name.toLowerCase().includes('metamask')
      ) ||
      null
    );
  }, [connectors]);

  const connectMetaMask = async (fallbackShow?: () => void) => {
    try {
      if (metaMaskConnector) {
        await connectAsync({ connector: metaMaskConnector });
      } else {
        fallbackShow?.();
      }
    } finally {
      setOpen(false);
    }
  };

  const switchTo = async (targetId: number, isConnected?: boolean) => {
    setAppChainId(targetId);
    if (!isConnected) return setOpen(false);
    try {
      await switchChainAsync({ chainId: targetId });
    } finally {
      setOpen(false);
    }
  };

  // hover helpers
  const dropdownHoverClass = showHoverBg ? 'hover:bg-panel-hover-bg' : 'hover:bg-transparent';
  const mainHoverClassBtn =
    showHoverBg
      ? 'hover:bg-connect-hover-bg hover:text-connect-hover-color'
      : 'hover:bg-transparent hover:text-connect-color';

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, address, truncatedAddress, chain, show }) => {
        // figure out the current chain data for labels/icons
        const currentIdBase =
          (typeof appChainId === 'number' && appChainId > 0 ? appChainId : undefined) ??
          (typeof walletChainId === 'number' && walletChainId > 0 ? walletChainId : undefined) ??
          options[0]?.id;

        const currentId = isConnected
          ? (chain?.id ??
             appChainId ??
             (typeof walletChainId === 'number' ? walletChainId : undefined))
          : currentIdBase;

        const currentOpt = options.find((o) => o.id === currentId);
        const currentName =
          currentOpt?.name || chain?.name || (typeof currentId === 'number' ? `Chain ${currentId}` : '');
        const currentSymbol =
          currentOpt?.symbol || (chain as any)?.nativeCurrency?.symbol || '';

        // label builder used in BOTH modes
        let label = '';
        if (showName && currentName) label = currentName;
        if (showSymbol && currentSymbol) label = label ? `${label} (${currentSymbol})` : currentSymbol;

        // --- DISCONNECTED ---
        if (!isConnected) {
          return (
            <div className="relative m-0">
              {/* main button (acts as dropdown toggle when clicking outside the Connect text) */}
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={`
                  bg-connect-bg text-connect-color font-bold rounded-lg px-3 py-1.5
                  flex items-center gap-2 text-sm outline-none border-0 focus:ring-0
                  ${mainHoverClassBtn}
                `}
              >
                {typeof currentId === 'number' && (
                  <img
                    src={`/assets/blockchains/${currentId}/info/network.png`}
                    alt="Network"
                    className="h-8 w-8 rounded"
                  />
                )}

                {/* If showConnect=true → show "Connect"; else show the same name/symbol label logic */}
                {showConnect ? (
                  <span className="font-bold text-base opacity-90">Connect</span>
                ) : (
                  label && <span className="opacity-85 font-bold">{label}</span>
                )}

                {showChevron && <span className="text-xs opacity-75 font-bold">▼</span>}
              </button>

              {/* Separate "Connect" action inside the dropdown too */}
              {open && (
                <ul
                  ref={listRef}
                  role="menu"
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
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                                      transition-colors text-panel-text
                                      ${dropdownHoverClass} ${isCurrent ? 'bg-panel-hover-bg' : ''}`}
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
                      onClick={() => connectMetaMask(show)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                                  transition-colors text-panel-text ${dropdownHoverClass}`}
                    >
                      <span className="text-lg">🔗</span>
                      <span className="font-bold">Connect</span>
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
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                                  transition-colors text-panel-text ${dropdownHoverClass}`}
                    >
                      <span className="font-bold">Open Wallet Modal…</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          );
        }

        // --- CONNECTED ---
        return (
          <div className="relative m-0">
            <button
              onClick={() => setOpen((v) => !v)}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              className={`
                bg-connect-bg text-connect-color font-bold rounded-lg px-3 py-1.5
                flex items-center gap-2 text-sm outline-none border-0 focus:ring-0
                ${mainHoverClassBtn}
              `}
            >
              {typeof currentId === 'number' && (
                <img
                  src={`/assets/blockchains/${currentId}/info/network.png`}
                  alt="Network"
                  className="h-8 w-8 rounded"
                />
              )}
              {label && <span className="opacity-85 font-bold">{label}</span>}
              {showChevron && <span className="text-xs opacity-75 font-bold">▼</span>}
            </button>

            {open && (
              <ul
                ref={listRef}
                role="menu"
                className="absolute right-0 top-full w-72 rounded-lg p-0 z-50
                           bg-panel-bg text-panel-text shadow-none"
              >
                {/* Account Address row (styled like other items, disabled) */}
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                               text-panel-text cursor-default"
                  >
                    {typeof currentId === 'number' && (
                      <img
                        src={`/assets/blockchains/${currentId}/info/network.png`}
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-6 rounded"
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="leading-tight font-bold">
                        {truncatedAddress ?? address}
                      </div>
                      <div className="text-xs opacity-75 font-bold">Account Address</div>
                    </div>
                  </button>
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
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                                    transition-colors text-panel-text disabled:opacity-50
                                    ${dropdownHoverClass} ${isCurrent ? 'bg-panel-hover-bg' : ''}`}
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
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                               transition-colors text-panel-text ${dropdownHoverClass}`}
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
                      (show as (() => void) | undefined)?.();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md font-bold
                               transition-colors text-panel-text ${dropdownHoverClass}`}
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
