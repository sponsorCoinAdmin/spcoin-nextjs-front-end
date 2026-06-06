'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Wallet } from 'lucide-react';

import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import { normalizeAddress } from '@/lib/utils/address';
import type { SpCoinWalletAccount } from './types';

type NetworkAccountListProps = {
  accounts: SpCoinWalletAccount[];
  walletSource: 'hardhat' | 'metamask' | 'offline';
  selectedAddressKey: string;
  normalizedWorkingAddress: string;
  hardhatAccountsCount: number;
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  metamaskAuthorized: boolean;
  connectStatus: 'error' | 'idle' | 'pending' | 'success';
  onRefreshHardhatAccounts: () => void;
  onConnectMetaMask: () => void;
  onOpenAccountPanel: (account: SpCoinWalletAccount) => void;
  onSelectAccount: (account: SpCoinWalletAccount) => void;
  showSummaryBar?: boolean;
};

function sourceLabel(source: SpCoinWalletAccount['source']): string {
  if (source === 'hardhat') return 'Hardhat Wallet';
  if (source === 'metamask') return 'MetaMask';
  return 'Offline';
}

function AccountRow({
  account,
  isActiveRow,
  selected,
  onOpenAccountPanel,
  onSelect,
}: {
  account: SpCoinWalletAccount;
  isActiveRow: boolean;
  selected: boolean;
  onOpenAccountPanel: () => void;
  onSelect: () => void;
}) {
  const [imageSrc, setImageSrc] = useState(account.logoURL || defaultMissingImage);
  const [imageFailed, setImageFailed] = useState(false);
  const meta = [account.label, account.symbol].filter(Boolean).join(' | ');

  useEffect(() => {
    setImageSrc(account.logoURL || defaultMissingImage);
    setImageFailed(false);
  }, [account.logoURL]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={[
        'grid w-full grid-cols-[36px_1fr] items-center gap-3 px-3 py-2 text-left',
        'border-b border-slate-700/70 transition-colors hover:bg-slate-700/50',
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7893ff]',
        isActiveRow ? 'bg-green-500/20 hover:bg-green-500/25' : selected ? 'bg-[#273250]' : 'bg-transparent',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
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
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">
          {meta || sourceLabel(account.source)}
        </span>
        <span className="block truncate font-mono text-xs text-slate-300">{account.address}</span>
      </span>
    </div>
  );
}

export default function NetworkAccountList({
  accounts,
  walletSource,
  selectedAddressKey,
  normalizedWorkingAddress,
  hardhatAccountsCount,
  hardhatAccountsLoading,
  hardhatAccountsError,
  metamaskAuthorized,
  connectStatus,
  onRefreshHardhatAccounts,
  onConnectMetaMask,
  onOpenAccountPanel,
  onSelectAccount,
  showSummaryBar = true,
}: NetworkAccountListProps) {
  return (
    <>
      {showSummaryBar ? (
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex-1 text-center">
            <div className="text-[18px] font-semibold text-slate-400">
              {walletSource === 'hardhat'
                ? `${hardhatAccountsCount} Hardhat account${hardhatAccountsCount === 1 ? '' : 's'}`
                : metamaskAuthorized
                  ? 'MetaMask authorized account'
                  : 'MetaMask not authorized'}
            </div>
          </div>
          {walletSource === 'hardhat' ? (
            <button
              type="button"
              onClick={onRefreshHardhatAccounts}
              className="flex h-9 w-9 items-center justify-center rounded bg-[#1d2542] hover:bg-[#29345c]"
              title="Refresh accounts"
            >
              <RefreshCw className={['h-4 w-4', hardhatAccountsLoading ? 'animate-spin' : ''].join(' ')} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectMetaMask}
              className="rounded bg-[#dba84f] px-4 py-2 text-sm font-bold text-black hover:bg-[#e9bb68]"
            >
              {connectStatus === 'pending' ? 'Connecting' : 'Connect MetaMask'}
            </button>
          )}
        </div>
      ) : null}

      <div className={['scrollbar-hide max-h-[360px] overflow-y-auto', showSummaryBar ? 'border-t border-slate-700/70' : ''].join(' ')}>
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
          accounts.map((account) => (
            <AccountRow
              key={`${account.source}:${account.address}`}
              account={account}
              isActiveRow={normalizeAddress(account.address) === normalizedWorkingAddress}
              selected={normalizeAddress(account.address) === selectedAddressKey}
              onOpenAccountPanel={() => onOpenAccountPanel(account)}
              onSelect={() => onSelectAccount(account)}
            />
          ))
        )}
      </div>
    </>
  );
}
