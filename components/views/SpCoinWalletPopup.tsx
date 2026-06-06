'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Wallet, X } from 'lucide-react';
import { useConnect } from 'wagmi';

import AccountComponent from '@/components/views/accountComponent';
import { NetworkAccountList, useSpCoinWallet } from '@/lib/spCoinWallet';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import type { SpCoinWalletAccount, SpCoinWalletSource } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY, STATUS, type spCoinAccount } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';

function sourceLabel(source: SpCoinWalletSource): string {
  if (source === 'hardhat') return 'Hardhat Wallet';
  if (source === 'metamask') return 'MetaMask';
  return 'Offline';
}

function shortAddress(address?: string): string {
  const value = String(address ?? '').trim();
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value || 'Not connected';
}

export default function SpCoinWalletPopup() {
  const {
    isOpen,
    closeWallet,
    session,
    walletSource,
    setWalletSource,
    hardhatAccounts,
    hardhatAccountsLoading,
    hardhatAccountsError,
    refreshHardhatAccounts,
    selectionRequest,
    selectAccount,
  } = useSpCoinWallet();
  const openAccountComponent = useOpenAccountComponent();
  const { connectAsync, connectors, status: connectStatus } = useConnect();
  const [previewAccount, setPreviewAccount] = useState<spCoinAccount | undefined>(undefined);
  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );

  const visibleAccounts = useMemo(() => {
    if (walletSource === 'hardhat') return hardhatAccounts;
    if (session.metamaskAuthorized && session.signerAddress) {
      return [
        {
          address: session.signerAddress,
          label: 'MetaMask Active Account',
          source: 'metamask' as const,
        },
      ];
    }
    return [];
  }, [hardhatAccounts, session.metamaskAuthorized, session.signerAddress, walletSource]);

  const connectedAccount = useMemo(() => {
    const activeAddress = normalizeAddress(session.activeAccountAddress || '');
    if (!activeAddress) return null;
    const hardhatMatch = hardhatAccounts.find(
      (account) => normalizeAddress(account.address) === activeAddress,
    );
    if (hardhatMatch) return hardhatMatch;
    return {
      address: session.activeAccountAddress || '',
      label: 'Active Account',
      source: walletSource === 'hardhat' ? 'hardhat' : 'metamask',
    } satisfies SpCoinWalletAccount;
  }, [hardhatAccounts, session.activeAccountAddress, walletSource]);

  const requiresPrivateKeySigner = Boolean(selectionRequest?.requirePrivateKeySigner);
  const normalizedWorkingAddress = normalizeAddress(session.activeAccountAddress || '');

  const connectMetaMask = async () => {
    const injected = connectors.find((connector) => connector.id === 'injected') ?? connectors[0];
    if (!injected) return;
    await connectAsync({ connector: injected });
  };

  const openAccountPanel = (account: SpCoinWalletAccount) => {
    const nextAccount: spCoinAccount = {
      name: String(account.name || account.label || 'Unnamed account').trim(),
      symbol: String(account.symbol || '').trim(),
      type: 'account',
      website: '',
      description: '',
      status: STATUS.INFO,
      address: account.address as spCoinAccount['address'],
      ...(account.logoURL ? { logoURL: account.logoURL } : {}),
      balance: 0n,
    };

    if (isSelectionMode) {
      setPreviewAccount(nextAccount);
      return;
    }

    openAccountComponent({
      account: nextAccount,
      close: closeWallet,
      source: 'SpCoinWalletPopup:openAccountPanel',
    });
  };

  if (!isOpen) return null;

  const isSelectionMode = Boolean(selectionRequest);

  if (isSelectionMode) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/35">
        <div
          className={[
            'absolute left-1/2 top-1/2 w-[min(520px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden',
            'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label="Select Network Account"
        >
          <div className="relative border-b border-slate-700/70 px-5 py-4">
            <h2 className="pointer-events-none text-center text-xl font-bold leading-tight">
              Select Network Account
            </h2>
            <button
              type="button"
              onClick={() => {
                setPreviewAccount(undefined);
                closeWallet();
              }}
              className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
              aria-label="Close account selection"
            >
              <X className="h-6 w-6 text-[#91a5ff]" />
            </button>
          </div>

          <NetworkAccountList
            accounts={visibleAccounts}
            walletSource={walletSource}
            selectedAddressKey={selectedAddressKey}
            normalizedWorkingAddress={normalizedWorkingAddress}
            hardhatAccountsCount={hardhatAccounts.length}
            hardhatAccountsLoading={hardhatAccountsLoading}
            hardhatAccountsError={hardhatAccountsError}
            metamaskAuthorized={session.metamaskAuthorized}
            connectStatus={connectStatus}
            onRefreshHardhatAccounts={() => void refreshHardhatAccounts()}
            onConnectMetaMask={() => void connectMetaMask()}
            onOpenAccountPanel={openAccountPanel}
            onSelectAccount={selectAccount}
          />
        </div>

        {previewAccount ? (
          <div className="fixed inset-0 z-[10001]">
            <div
              className={[
                'pointer-events-auto absolute left-1/2 top-1/2 w-[min(520px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden',
                'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
              ].join(' ')}
              role="dialog"
              aria-modal="true"
              aria-label={previewAccount.name ? `Account ${previewAccount.name}` : 'Account details'}
            >
              <div className="relative border-b border-slate-700/70 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]">
                    {previewAccount.logoURL ? (
                      <img
                        src={previewAccount.logoURL}
                        alt={previewAccount.name || 'Account'}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Wallet className="h-5 w-5 text-[#7893ff]" />
                    )}
                  </span>
                </div>
                <h2 className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xl font-bold leading-tight">
                  {previewAccount.name ? `Account ${previewAccount.name}` : 'Account Details'}
                </h2>
                <button
                  type="button"
                  onClick={() => setPreviewAccount(undefined)}
                  className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
                  aria-label="Close account details"
                >
                  <X className="h-6 w-6 text-[#91a5ff]" />
                </button>
              </div>

              <div className="px-5 py-4">
                <AccountComponent
                  account={previewAccount}
                  mode={SP_COIN_DISPLAY.ACTIVE_ACCOUNT}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/35">
      <div
        className={[
          'absolute left-1/2 top-1/2 w-[min(520px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden',
          'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="SponsorCoin Wallet"
      >
        <div className="relative border-b border-slate-700/70 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-[#20294a]">
              <Image
                src="/assets/miscellaneous/spCoin.png"
                alt="SponsorCoin"
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            </span>
          </div>
          <h2 className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xl font-bold leading-tight">
            SponsorCoin Wallet
          </h2>
          <button
            type="button"
            onClick={closeWallet}
            className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
            aria-label="Close SponsorCoin wallet"
          >
            <X className="h-6 w-6 text-[#91a5ff]" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-2 text-sm font-bold text-white">Connected Account</div>
          <div className="flex items-center gap-3 rounded-[15px] border border-slate-700 bg-[#111625] px-4 py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#243056]">
              {connectedAccount?.logoURL ? (
                <Image
                  src={connectedAccount.logoURL}
                  alt={connectedAccount.name ?? connectedAccount.label ?? 'Connected account'}
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                  unoptimized
                />
              ) : (
                <Wallet className="h-5 w-5 text-[#7893ff]" />
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-white">
                {connectedAccount?.name ?? connectedAccount?.label ?? 'Not connected'}
              </div>
              <div className="truncate font-mono text-xs text-slate-300">
                {connectedAccount?.address || shortAddress(session.activeAccountAddress)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 px-5 py-4">
          {(['hardhat', 'metamask'] as SpCoinWalletSource[]).map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => setWalletSource(source)}
              disabled={requiresPrivateKeySigner && source !== 'hardhat'}
              className={[
                'h-11 rounded border text-sm font-bold transition-colors',
                requiresPrivateKeySigner && source !== 'hardhat'
                  ? 'cursor-not-allowed border-slate-800 bg-[#111625] text-slate-500'
                  : '',
                walletSource === source
                  ? 'border-[#7893ff] bg-[#25305a] text-white'
                  : 'border-slate-700 bg-[#151a2c] text-slate-300 hover:bg-[#202844]',
              ].join(' ')}
            >
              {sourceLabel(source)}
            </button>
          ))}
        </div>

        {requiresPrivateKeySigner ? (
          <div className="mx-5 mt-1 rounded border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
            This selection requires a private-key signer, so the wallet is locked to Hardhat Wallet.
          </div>
        ) : null}

        <NetworkAccountList
          accounts={visibleAccounts}
          walletSource={walletSource}
          selectedAddressKey={selectedAddressKey}
          normalizedWorkingAddress={normalizedWorkingAddress}
          hardhatAccountsCount={hardhatAccounts.length}
          hardhatAccountsLoading={hardhatAccountsLoading}
          hardhatAccountsError={hardhatAccountsError}
          metamaskAuthorized={session.metamaskAuthorized}
          connectStatus={connectStatus}
          onRefreshHardhatAccounts={() => void refreshHardhatAccounts()}
          onConnectMetaMask={() => void connectMetaMask()}
          onOpenAccountPanel={openAccountPanel}
          onSelectAccount={selectAccount}
        />
      </div>
    </div>
  );
}
