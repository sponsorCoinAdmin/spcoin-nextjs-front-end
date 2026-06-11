'use client';

import React from 'react';
import { RefreshCw, X } from 'lucide-react';

import Accounts from './accounts';
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
  headerTitle?: string;
  headerSummary?: string;
  headerIconSrc?: string;
  headerIconTitle?: string;
  refreshLabel?: string;
  onClose?: () => void;
};

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
  headerTitle,
  headerSummary,
  headerIconSrc,
  headerIconTitle,
  refreshLabel,
  onClose,
}: NetworkAccountListProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const showHeaderCard = Boolean(headerTitle || headerSummary || onClose);
  const summaryText = headerSummary
    ?? (walletSource === 'hardhat'
      ? `${hardhatAccountsCount} Hardhat account${hardhatAccountsCount === 1 ? '' : 's'}`
      : metamaskAuthorized
        ? 'MetaMask authorized account'
        : 'MetaMask not authorized');

  return (
    <>
      {showHeaderCard ? (
        <div className="relative border-b border-slate-700/70 px-5 pt-3 pb-[8px]">
          {headerIconSrc ? (
            <span
              className="absolute left-[0.625rem] top-2 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]"
              title={headerIconTitle}
            >
              <img
                src={headerIconSrc}
                alt="Active network"
                className="h-8 w-8 rounded object-contain"
              />
            </span>
          ) : null}
          {headerTitle ? (
            <h2 className="pointer-events-none text-center text-xl font-bold leading-none">
              {headerTitle}
            </h2>
          ) : null}
          <div className="-mt-1 flex items-center justify-center gap-1">
            <div className="relative top-[2px] text-base font-semibold text-slate-400">{summaryText}</div>
            {walletSource === 'hardhat' ? (
              <button
                type="button"
                onClick={onRefreshHardhatAccounts}
                className="relative top-[3px] flex items-center justify-center text-[#91a5ff] hover:text-white"
                title={refreshLabel}
                aria-label={refreshLabel}
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
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-[0.625rem] top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
              aria-label="Close account selection"
            >
              <X className="h-6 w-6 text-[#91a5ff]" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex-1 text-center">
            <div className="text-[18px] font-semibold text-slate-400">{summaryText}</div>
          </div>
          {walletSource === 'hardhat' ? (
            <button
              type="button"
              onClick={onRefreshHardhatAccounts}
              className="flex h-9 w-9 items-center justify-center rounded bg-[#1d2542] hover:bg-[#29345c]"
              title={refreshLabel || 'Refresh accounts'}
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
      )}

      <Accounts
        accounts={accounts}
        walletSource={walletSource}
        selectedAddressKey={selectedAddressKey}
        normalizedWorkingAddress={normalizedWorkingAddress}
        isCollapsed={isCollapsed}
        hardhatAccountsLoading={hardhatAccountsLoading}
        hardhatAccountsError={hardhatAccountsError}
        onOpenAccountPanel={onOpenAccountPanel}
        onSelectAccount={onSelectAccount}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
    </>
  );
}
