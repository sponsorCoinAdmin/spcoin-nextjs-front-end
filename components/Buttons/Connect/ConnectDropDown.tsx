// File: components/Buttons/Connect/ConnectDropDown.tsx
'use client';

import React from 'react';
import Image from 'next/image';

type NetOpt = { id: number; name: string; symbol: string; logo?: string };

type Props = {
  // existing props
  isConnected: boolean;
  address?: string;
  truncatedAddress?: string;
  currentId?: number;
  isPending?: boolean;
  showHoverBg?: boolean;
  showConnectRow?: boolean;
  showDisconnectRow?: boolean;
  onSelectNetwork: (id: number) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenWalletModal: () => void;

  // NEW (from your last step)
  mainnetOptions: NetOpt[];
  testnetOptions: NetOpt[];
  showTestNets: boolean;
  onToggleShowTestNets: () => void;
};

export default function ConnectDropdown({
  isConnected,
  address,
  truncatedAddress,
  currentId,
  isPending,
  showHoverBg,
  showConnectRow,
  showDisconnectRow,
  onSelectNetwork,
  onConnect,
  onDisconnect,
  onOpenWalletModal,
  mainnetOptions,
  testnetOptions,
  showTestNets,
  onToggleShowTestNets,
}: Props) {
  const Divider: React.FC = () => (
    <hr className="my-1 border-white/20 dark:border-black/20 opacity-50" />
  );

  type RowProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    hoverBg?: boolean;
  };

  const Row: React.FC<RowProps> = ({ children, active, hoverBg, className, ...btnProps }) => (
    <button
      type="button"
      {...btnProps}
      className={[
        'w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded',
        btnProps.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        active ? 'bg-white/10' : hoverBg ? 'hover:bg-white/10' : 'hover:bg-white/5',
        className || '',
      ].join(' ')}
    >
      {children}
    </button>
  );

  const renderOption = (opt: NetOpt) => {
    const active = currentId === opt.id;
    return (
      <Row
        key={opt.id}
        onClick={() => onSelectNetwork(opt.id)}
        active={active}
        hoverBg={!!showHoverBg}
        aria-current={active ? 'true' : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          {opt.logo ? (
            <Image
              src={opt.logo}
              alt={opt.name}
              width={16}
              height={16}
              className="h-4 w-4 object-contain shrink-0"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-white/20 shrink-0" />
          )}
          <span className="truncate text-sm">{opt.name}</span>
        </div>
        <span className="text-sm opacity-70 shrink-0">{opt.symbol}</span>
      </Row>
    );
  };

  return (
    <div className="min-w-[260px] max-w-[360px] rounded-lg shadow-xl border border-white/10 bg-[#101218] text-white p-2 backdrop-blur-sm">
      {/* MAINNETS */}
      {mainnetOptions.map(renderOption)}

      {/* TESTNETS — only when enabled */}
      {showTestNets && testnetOptions.length > 0 && (
        <>
          <Divider />
          {testnetOptions.map(renderOption)}
        </>
      )}

      {/* ACTIONS */}
      {(showConnectRow || showDisconnectRow) && <Divider />}

      {/* Green “Connect” (same text size as network rows) */}
      {showConnectRow && (
        <Row
          onClick={onConnect}
          hoverBg={!!showHoverBg}
          className="!text-[#34d399] hover:bg-[rgba(52,211,153,0.12)]"
          data-variant="connect"
        >
          <span className="flex items-center gap-2 font-medium min-w-0 text-sm">
            <span className="h-2 w-2 rounded-full bg-[#34d399] shrink-0" />
            <span className="truncate">Connect</span>
          </span>
          <span className="shrink-0" />
        </Row>
      )}

      {/* Red “Disconnect” (same text size) + right-aligned address (same size) */}
      {showDisconnectRow && (
        <Row
          onClick={onDisconnect}
          hoverBg={!!showHoverBg}
          className="!text-[#f87171] hover:bg-[rgba(248,113,113,0.12)]"
          data-variant="disconnect"
        >
          <span className="flex items-center gap-2 font-medium min-w-0 text-sm">
            <span className="h-2 w-2 rounded-full bg-[#f87171] shrink-0" />
            <span className="truncate">Disconnect</span>
          </span>
          <span className="ml-3 text-sm opacity-70 whitespace-nowrap font-mono shrink-0 max-w-[60%] truncate text-right">
            {truncatedAddress ?? address}
          </span>
        </Row>
      )}

      <Row onClick={onOpenWalletModal} hoverBg={!!showHoverBg}>
        <span className="text-sm">Open Wallet Modal…</span>
      </Row>

      {/* Checkbox row */}
      <Divider />
      <label className="flex items-center justify-between text-sm px-3 py-2 select-none">
        <span>Show Test Nets</span>
        <input
          type="checkbox"
          checked={showTestNets}
          onChange={onToggleShowTestNets}
          className="h-4 w-4 accent-[#5981F3] cursor-pointer"
        />
      </label>
    </div>
  );
}
