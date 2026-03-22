'use client';

import React, { useEffect, useRef, useState } from 'react';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { useExchangeContext } from '@/lib/context/hooks';
import { isTestnetChainId, toggleShowTestNetsUpdater } from '@/lib/utils/network';
import { useNetworkOptions, type NetOpt } from '@/components/views/Buttons/Connect/hooks/useNetworkOptions';

type EditAccountAvatarDropdownProps = {
  avatarSrc?: string;
  disabled?: boolean;
  selectedNetworkIds: number[];
  onToggleNetwork: (networkId: number) => void;
};

export default function EditAccountAvatarDropdown({
  avatarSrc,
  disabled = false,
  selectedNetworkIds,
  onToggleNetwork,
}: EditAccountAvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { mainnetOptions, testnetOptions } = useNetworkOptions();
  const resolvedAvatarSrc =
    String(avatarSrc ?? '').trim() || defaultMissingImage;
  const showTestNets = Boolean(exchangeContext?.settings?.showTestNets);
  const hasSelectedTestnet = selectedNetworkIds.some((networkId) => isTestnetChainId(networkId));

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!hasSelectedTestnet || showTestNets) return;
    setExchangeContext(
      (prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          showTestNets: true,
        },
      }),
      'EditAccountAvatarDropdown:showSavedRecipientTestnets',
    );
  }, [hasSelectedTestnet, setExchangeContext, showTestNets]);

  const Divider: React.FC = () => (
    <hr className="my-1 border-white/20 opacity-50" />
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
    const active = selectedNetworkIds.includes(opt.id);
    return (
      <Row
        key={opt.id}
        onClick={() => {
          onToggleNetwork(opt.id);
        }}
        active={active}
        hoverBg
        aria-current={active ? 'true' : undefined}
      >
        <div className="flex min-w-0 items-center gap-2">
          {opt.logo ? (
            <img
              src={opt.logo}
              alt={opt.name}
              className="h-4 w-4 shrink-0 object-contain"
            />
          ) : (
            <div className="h-4 w-4 shrink-0 rounded-full bg-white/20" />
          )}
          <span className="truncate text-sm">{opt.name}</span>
        </div>
        <input
          type="checkbox"
          checked={active}
          readOnly
          aria-label={`${opt.name} selected`}
          className="h-4 w-4 shrink-0 cursor-pointer accent-[#5981F3]"
        />
      </Row>
    );
  };

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        className="flex items-center rounded-lg bg-connect-bg px-3 py-1.5 text-sm font-bold text-connect-color outline-none transition-colors hover:bg-connect-hover-bg hover:text-connect-hover-color disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img
          src={resolvedAvatarSrc}
          alt="Edit account avatar"
          className="h-9 w-9 rounded object-cover"
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 min-w-[260px] max-w-[360px] rounded-lg border border-white/10 bg-[#101218] p-2 text-white shadow-xl backdrop-blur-sm">
          <div className="px-3 py-2 text-sm opacity-85 select-none">
            Recipient Network Selection
          </div>
          <Divider />
          {mainnetOptions.map(renderOption)}
          {showTestNets && testnetOptions.length > 0 ? (
            <>
              <Divider />
              {testnetOptions.map(renderOption)}
            </>
          ) : null}
          <Divider />
          <label className="flex items-center justify-between px-3 py-2 text-sm select-none">
            <span>Show Test Nets</span>
            <input
              type="checkbox"
              checked={showTestNets}
              onChange={() =>
                setExchangeContext(
                  toggleShowTestNetsUpdater,
                  'EditAccountAvatarDropdown:onToggleShowTestNets',
                )
              }
              className="h-4 w-4 cursor-pointer accent-[#5981F3]"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
