'use client';

import React from 'react';

import { normalizeAddress } from '@/lib/utils/address';
import type { SpCoinWalletAccount } from './types';
import AccountRow from './AccountRow';

type AccountsProps = {
  accounts: SpCoinWalletAccount[];
  walletSource: 'hardhat' | 'metamask' | 'offline';
  selectedAddressKey: string;
  normalizedWorkingAddress: string;
  isCollapsed: boolean;
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  onOpenAccountPanel: (account: SpCoinWalletAccount) => void;
  onSelectAccount: (account: SpCoinWalletAccount) => void;
  onToggleCollapse: () => void;
  onTrace?: (message: string, data?: any) => void;
};

function EmbeddedAccountList({
  accounts,
  walletSource,
  activeAddressKey,
  hardhatAccountsLoading,
  hardhatAccountsError,
  isCollapsed,
  onOpenAccountPanel,
  onSelectAccount,
  onTrace,
  onToggleCollapse,
}: {
  accounts: SpCoinWalletAccount[];
  walletSource: 'hardhat' | 'metamask' | 'offline';
  activeAddressKey: string;
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  isCollapsed: boolean;
  onOpenAccountPanel: (account: SpCoinWalletAccount) => void;
  onSelectAccount: (account: SpCoinWalletAccount) => void;
  onTrace?: (message: string, data?: any) => void;
  onToggleCollapse: (account: SpCoinWalletAccount) => void;
}) {
  const orderedAccounts = [...accounts].sort((left, right) => {
    const leftIsActive = normalizeAddress(left.address) === activeAddressKey ? 1 : 0;
    const rightIsActive = normalizeAddress(right.address) === activeAddressKey ? 1 : 0;
    return rightIsActive - leftIsActive;
  });
  const visibleAccounts = isCollapsed
    ? orderedAccounts.filter((account) => normalizeAddress(account.address) === activeAddressKey)
    : orderedAccounts;

  if (hardhatAccountsError && walletSource === 'hardhat') {
    return <div className="p-4 text-sm text-red-200">{hardhatAccountsError}</div>;
  }

  if (accounts.length === 0) {
    return (
      <div className="p-5 text-sm text-slate-300">
        {walletSource === 'metamask'
          ? 'Connect MetaMask to select a MetaMask account.'
          : hardhatAccountsLoading
            ? 'Loading Hardhat accounts...'
            : 'No accounts available.'}
      </div>
    );
  }

  return (
    <>
      {visibleAccounts.map((account) => (
        <AccountRow
          key={`${account.source}:${account.address}`}
          account={account}
          isActiveMarker={normalizeAddress(account.address) === activeAddressKey}
          isCollapsed={isCollapsed}
          onTrace={onTrace}
          onOpenAccountPanel={() => onOpenAccountPanel(account)}
          onSelect={() => onSelectAccount(account)}
          onToggleCollapse={() => onToggleCollapse(account)}
        />
      ))}
    </>
  );
}

export default function Accounts({
  accounts,
  walletSource,
  selectedAddressKey,
  normalizedWorkingAddress,
  isCollapsed,
  hardhatAccountsLoading,
  hardhatAccountsError,
  onOpenAccountPanel,
  onSelectAccount,
  onToggleCollapse,
  onTrace,
}: AccountsProps) {
  const normalizedSelectedKey = selectedAddressKey || normalizedWorkingAddress;
  const fallbackAddress = accounts[0] ? normalizeAddress(accounts[0].address) : '';
  const activeAddressKey = normalizedSelectedKey || fallbackAddress;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto border-t border-slate-700/70">
        <EmbeddedAccountList
          accounts={accounts}
          walletSource={walletSource}
          activeAddressKey={activeAddressKey}
          hardhatAccountsLoading={hardhatAccountsLoading}
          hardhatAccountsError={hardhatAccountsError}
          isCollapsed={isCollapsed}
          onOpenAccountPanel={onOpenAccountPanel}
          onSelectAccount={onSelectAccount}
          onTrace={onTrace}
          onToggleCollapse={(account) => {
            onTrace?.('Accounts onToggleCollapse received', {
              clickedAddress: account.address,
              activeAddressKey,
              clickedIsActive: normalizeAddress(account.address) === activeAddressKey,
              isCollapsedBefore: isCollapsed,
            });
            if (normalizeAddress(account.address) !== activeAddressKey) return;
            onToggleCollapse();
          }}
        />
      </div>
    </div>
  );
}
