'use client';

import React, { useEffect, useState } from 'react';

import AccountPanelContent from '@/components/views/RadioOverlayPanels/AccountPanel/AccountPanelContent';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';
import type { SpCoinWalletAccount } from './types';
import AccountRow from './AccountRow';

type AccountsProps = {
  accounts: SpCoinWalletAccount[];
  walletSource: 'hardhat' | 'metamask' | 'offline';
  selectedAddressKey: string;
  normalizedWorkingAddress: string;
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  onOpenAccountPanel: (account: SpCoinWalletAccount) => void;
  onSelectAccount: (account: SpCoinWalletAccount) => void;
  previewAccount?: spCoinAccount;
  onClosePreview?: () => void;
};

type AccountsDisplayState = 'ACCOUNT_LIST' | 'ACCOUNT_META';

function EmbeddedAccountList({
  accounts,
  walletSource,
  activeAddressKey,
  selectedAddressKey,
  hardhatAccountsLoading,
  hardhatAccountsError,
  isCollapsed,
  onOpenAccountPanel,
  onSelectAccount,
  onToggleCollapse,
}: {
  accounts: SpCoinWalletAccount[];
  walletSource: 'hardhat' | 'metamask' | 'offline';
  activeAddressKey: string;
  selectedAddressKey: string;
  hardhatAccountsLoading: boolean;
  hardhatAccountsError: string;
  isCollapsed: boolean;
  onOpenAccountPanel: (account: SpCoinWalletAccount) => void;
  onSelectAccount: (account: SpCoinWalletAccount) => void;
  onToggleCollapse: () => void;
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
          selected={normalizeAddress(account.address) === selectedAddressKey}
          isCollapsed={isCollapsed}
          onOpenAccountPanel={() => onOpenAccountPanel(account)}
          onSelect={() => onSelectAccount(account)}
          onToggleCollapse={onToggleCollapse}
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
  hardhatAccountsLoading,
  hardhatAccountsError,
  onOpenAccountPanel,
  onSelectAccount,
  previewAccount,
  onClosePreview,
}: AccountsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [displayState, setDisplayState] = useState<AccountsDisplayState>('ACCOUNT_LIST');
  const normalizedSelectedKey = selectedAddressKey || normalizedWorkingAddress;
  const fallbackAddress = accounts[0] ? normalizeAddress(accounts[0].address) : '';
  const activeAddressKey = normalizedSelectedKey || fallbackAddress;

  useEffect(() => {
    setIsCollapsed(false);
  }, [activeAddressKey, walletSource]);

  useEffect(() => {
    if (!previewAccount) {
      setDisplayState('ACCOUNT_LIST');
    }
  }, [previewAccount]);

  const handleOpenAccountPanel = (account: SpCoinWalletAccount) => {
    onOpenAccountPanel(account);
    setDisplayState('ACCOUNT_META');
  };

  const handleClosePreview = () => {
    onClosePreview?.();
    setDisplayState('ACCOUNT_LIST');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {displayState === 'ACCOUNT_LIST' ? (
        <div
          className={[
            'scrollbar-hide min-h-0 flex-1 overflow-y-auto border-t border-slate-700/70',
            'max-h-[360px]',
          ].join(' ')}
        >
          <EmbeddedAccountList
            accounts={accounts}
            walletSource={walletSource}
            activeAddressKey={activeAddressKey}
            selectedAddressKey={selectedAddressKey}
            hardhatAccountsLoading={hardhatAccountsLoading}
            hardhatAccountsError={hardhatAccountsError}
            isCollapsed={isCollapsed}
            onOpenAccountPanel={handleOpenAccountPanel}
            onSelectAccount={onSelectAccount}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          />
        </div>
      ) : null}

      {displayState === 'ACCOUNT_META' && previewAccount ? (
        <div className="min-h-0 flex-1 border-t border-slate-700/70">
          <AccountPanelContent
            account={previewAccount}
            onClose={handleClosePreview}
            mode={SP_COIN_DISPLAY.ACTIVE_ACCOUNT}
          />
        </div>
      ) : null}
    </div>
  );
}
