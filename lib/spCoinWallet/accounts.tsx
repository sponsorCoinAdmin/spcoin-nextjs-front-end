'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react';

import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { normalizeAddress } from '@/lib/utils/address';
import type { SpCoinWalletAccount } from './types';

type AccountsProps = {
  accounts: SpCoinWalletAccount[];
  walletSource: 'hardhat' | 'metamask' | 'offline';
  selectedAddressKey: string;
  normalizedWorkingAddress: string;
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  onOpenAccountPanel: (account: SpCoinWalletAccount) => void;
  onSelectAccount: (account: SpCoinWalletAccount) => void;
};

function sourceLabel(source: SpCoinWalletAccount['source']): string {
  if (source === 'hardhat') return 'Hardhat Wallet';
  if (source === 'metamask') return 'MetaMask';
  return 'Offline';
}

function AccountRow({
  account,
  isActiveMarker,
  selected,
  isCollapsed,
  onOpenAccountPanel,
  onSelect,
  onToggleCollapse,
}: {
  account: SpCoinWalletAccount;
  isActiveMarker: boolean;
  selected: boolean;
  isCollapsed: boolean;
  onOpenAccountPanel: () => void;
  onSelect: () => void;
  onToggleCollapse: () => void;
}) {
  const [imageSrc, setImageSrc] = useState(account.logoURL || defaultMissingImage);
  const [imageFailed, setImageFailed] = useState(false);
  const meta = [account.label, account.symbol].filter(Boolean).join(' | ');

  useEffect(() => {
    setImageSrc(account.logoURL || defaultMissingImage);
    setImageFailed(false);
  }, [account.logoURL]);

  return (
    <div className="grid w-full grid-cols-[36px_1fr] items-center gap-3 px-3 py-2 text-left border-b border-slate-700/70 transition-colors hover:bg-slate-700/50">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          console.debug('Account icon clicked', {
            address: account.address,
            label: account.label,
            source: account.source,
          });
          onOpenAccountPanel();
        }}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]"
        title="Open account panel"
      >
        {!imageFailed ? (
          <img
            src={imageSrc}
            alt={account.name ?? account.label ?? 'Account'}
            className="h-full w-full object-contain"
            onError={() => {
              if (imageSrc !== defaultMissingImage) {
                setImageSrc(defaultMissingImage);
                return;
              }
              setImageFailed(true);
            }}
          />
        ) : (
          <Wallet className="h-5 w-5 text-[#7893ff]" />
        )}
      </button>
      <div className={['grid min-w-0 grid-cols-[1fr_auto] items-center gap-2', isActiveMarker ? 'bg-green-500/20 hover:bg-green-500/25' : selected ? 'bg-[#273250]' : 'bg-transparent'].join(' ')}>
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 rounded-none border-none bg-transparent px-0 py-0 text-left text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7893ff]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 truncate text-sm font-semibold text-white">
              <span className="truncate">{meta || sourceLabel(account.source)}</span>
              {isActiveMarker ? (
                <span className="shrink-0 rounded bg-green-500/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-green-200">
                  Active
                </span>
              ) : null}
            </span>
            <span className="block truncate font-mono text-xs text-slate-300">{account.address}</span>
          </span>
        </button>
        {isActiveMarker ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleCollapse();
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-slate-300 transition-colors hover:bg-[#1d2542] hover:text-white"
            aria-label={isCollapsed ? 'Show all accounts' : 'Hide other accounts'}
            title={isCollapsed ? 'Show all accounts' : 'Hide other accounts'}
          >
            {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function Accounts({
  accounts,
  walletSource,
  selectedAddressKey,
  normalizedWorkingAddress,
  hardhatAccountsLoading,
  hardhatAccountsError,
  onOpenAccountPanel,
  onSelectAccount,
}: AccountsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const normalizedSelectedKey = selectedAddressKey || normalizedWorkingAddress;
  const fallbackAddress = accounts[0] ? normalizeAddress(accounts[0].address) : '';
  const activeAddressKey = normalizedSelectedKey || fallbackAddress;
  const orderedAccounts = [...accounts].sort((left, right) => {
    const leftIsActive = normalizeAddress(left.address) === activeAddressKey ? 1 : 0;
    const rightIsActive = normalizeAddress(right.address) === activeAddressKey ? 1 : 0;
    return rightIsActive - leftIsActive;
  });
  const visibleAccounts = isCollapsed
    ? orderedAccounts.filter((account) => normalizeAddress(account.address) === activeAddressKey)
    : orderedAccounts;

  useEffect(() => {
    setIsCollapsed(false);
  }, [activeAddressKey, walletSource]);

  return (
    <div className="scrollbar-hide max-h-[360px] overflow-y-auto border-t border-slate-700/70">
      {hardhatAccountsError && walletSource === 'hardhat' ? (
        <div className="p-4 text-sm text-red-200">{hardhatAccountsError}</div>
      ) : null}
      {accounts.length === 0 ? (
        <div className="p-5 text-sm text-slate-300">
          {walletSource === 'metamask'
            ? 'Connect MetaMask to select a MetaMask account.'
            : hardhatAccountsLoading
              ? 'Loading Hardhat accounts...'
              : 'No accounts available.'}
        </div>
      ) : (
        visibleAccounts.map((account) => (
          <AccountRow
            key={`${account.source}:${account.address}`}
            account={account}
            isActiveMarker={normalizeAddress(account.address) === activeAddressKey}
            selected={normalizeAddress(account.address) === selectedAddressKey}
            isCollapsed={isCollapsed}
            onOpenAccountPanel={() => onOpenAccountPanel(account)}
            onSelect={() => onSelectAccount(account)}
            onToggleCollapse={() => setIsCollapsed((value) => !value)}
          />
        ))
      )}
    </div>
  );
}
