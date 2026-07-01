'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, Copy, Menu, RefreshCw, Wallet, X } from 'lucide-react';

type WalletHeaderMode = 'selection' | 'normal';

interface WalletHeaderProps {
  mode: WalletHeaderMode;
  title?: string;
  networkTitle?: string;
  appChainId?: number;
  accountLogoURL?: string;
  accountLogoAlt?: string;
  leftSlot?: React.ReactNode;
  selectionSummary?: string;
  walletSource?: string;
  hardhatAccountsLoading?: boolean;
  connectStatus?: string;
  onRefresh?: () => void;
  onConnectMetaMask?: () => void;
  onMenuClick?: () => void;
  menuButtonKind?: 'menu' | 'back';
  bottomSlot?: React.ReactNode;
  onExpand?: () => void;
  onClose: () => void;
}

export default function WalletHeader({
  mode,
  title,
  networkTitle,
  appChainId,
  accountLogoURL,
  accountLogoAlt,
  leftSlot,
  selectionSummary,
  walletSource,
  hardhatAccountsLoading,
  connectStatus,
  onRefresh,
  onConnectMetaMask,
  onMenuClick,
  menuButtonKind = 'menu',
  bottomSlot,
  onExpand,
  onClose,
}: WalletHeaderProps) {
  const isSelection = mode === 'selection';

  return (
    <div className={`relative bg-[#77808e] ${isSelection ? 'border-b border-[#21273a] px-5 pt-[11px] pb-[10px]' : `pl-4 pr-[10px] pt-[6px] ${bottomSlot ? 'pb-0' : 'pb-[6px]'}`}`}>
      {isSelection ? (
        <>
          <span
            className="absolute left-5 top-2 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]"
            title={networkTitle}
          >
            {Number.isFinite(appChainId ?? 0) && (appChainId ?? 0) > 0 ? (
              <img
                src={`/assets/blockchains/${appChainId ?? 0}/logo.png`}
                alt="Active network"
                className="h-8 w-8 rounded object-contain"
              />
            ) : (
              <Wallet className="h-5 w-5 text-[#7893ff]" />
            )}
          </span>
          <h2 className="pointer-events-none text-center text-xl font-bold leading-none">
            Select Network Account
          </h2>
          <div className="-mt-[1px] flex items-center justify-center gap-2">
            <div className="relative top-[4px] text-[15px] font-semibold text-slate-400">{selectionSummary}</div>
            {walletSource === 'hardhat' ? (
              <button
                type="button"
                onClick={onRefresh}
                className="relative top-[4px] flex items-center justify-center text-[#91a5ff] hover:text-white"
                title={`Refresh Accounts`}
                aria-label="Refresh accounts"
              >
                <RefreshCw className={['h-[15px] w-[15px]', hardhatAccountsLoading ? 'animate-spin' : ''].join(' ')} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectMetaMask}
                className="rounded bg-[#dba84f] px-3 py-2 text-sm font-bold text-black hover:bg-[#e9bb68]"
              >
                {connectStatus === 'pending' ? 'Connecting' : 'Connect MetaMask'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-[0.625rem] top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
            aria-label="Close account selection"
          >
            <X className="h-6 w-6 text-[#91a5ff]" />
          </button>
        </>
      ) : (
        <>
          <div className="relative flex items-center">
            {leftSlot ?? (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden bg-transparent">
                {accountLogoURL ? (
                  <Image
                    src={accountLogoURL}
                    alt={accountLogoAlt ?? 'Active account logo'}
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Image
                    src="/assets/miscellaneous/spCoin.png"
                    alt="SponsorCoin"
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                  />
                )}
              </span>
            )}
            <h2 className="pointer-events-none absolute inset-x-0 text-center text-2xl font-bold leading-tight text-slate-200">
              {title ?? 'Merit Wallet'}
            </h2>
            <div className="ml-auto flex shrink-0 items-center">
              {onMenuClick ? (
                <button
                  type="button"
                  onClick={onMenuClick}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
                  aria-label={menuButtonKind === 'back' ? 'Return to wallet options' : 'Open wallet menu'}
                >
                  {menuButtonKind === 'back' ? (
                    <ArrowLeft className="h-6 w-6 text-[#91a5ff]" />
                  ) : (
                    <Menu className="h-6 w-6 text-[#91a5ff]" />
                  )}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onExpand}
                className="flex h-11 w-11 items-center justify-center hover:opacity-70"
                aria-label="Expand wallet"
              >
                <Copy className="h-[34px] w-[34px] text-gray-800" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center hover:opacity-70"
                aria-label="Close Merit Wallet"
              >
                <X className="h-[38px] w-[38px] text-gray-800" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </>
      )}
      {bottomSlot && <div>{bottomSlot}</div>}
    </div>
  );
}
