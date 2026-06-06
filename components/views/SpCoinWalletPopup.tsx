'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Wallet, X } from 'lucide-react';
import { useConnect } from 'wagmi';

import AccountComponent from '@/components/views/accountComponent';
import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { SP_COIN_DISPLAY, STATUS, type spCoinAccount } from '@/lib/structure';
import { normalizeAddress } from '@/lib/utils/address';
import Accounts from '@/lib/spCoinWallet/accounts';

export default function SpCoinWalletPopup() {
  const {
    isOpen,
    closeWallet,
    session,
    walletSource,
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
  const walletActiveAddressKey = normalizeAddress(session.activeAccountAddress || '');

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

  const normalizedWorkingAddress = normalizeAddress(session.activeAccountAddress || '');
  const currentNetworkName = Number.isFinite(session.appChainId) && session.appChainId > 0
    ? getBlockChainName(session.appChainId) || `Chain ${session.appChainId}`
    : 'Unknown Network';
  const currentNetworkTitle = Number.isFinite(session.appChainId) && session.appChainId > 0
    ? `${currentNetworkName} (Chain ID: ${session.appChainId})`
    : currentNetworkName;

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
  const selectionSummary = walletSource === 'hardhat'
    ? `${hardhatAccounts.length} Hardhat account${hardhatAccounts.length === 1 ? '' : 's'}`
    : session.metamaskAuthorized
      ? 'MetaMask authorized account'
      : 'MetaMask not authorized';

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
          <div className="relative border-b border-slate-700/70 px-5 pt-3 pb-[12px]">
            <span
              className="absolute left-[0.625rem] top-2 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#11162A]"
              title={currentNetworkTitle}
            >
              {Number.isFinite(session.appChainId) && session.appChainId > 0 ? (
                <img
                  src={`/assets/blockchains/${session.appChainId}/logo.png`}
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
                  onClick={() => void refreshHardhatAccounts()}
                  className="relative top-[4px] flex items-center justify-center text-[#91a5ff] hover:text-white"
                  title={`Refresh ${currentNetworkName} Accounts`}
                  aria-label={`Refresh ${currentNetworkName} Accounts`}
                >
                  <RefreshCw className={['h-[15px] w-[15px]', hardhatAccountsLoading ? 'animate-spin' : ''].join(' ')} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void connectMetaMask()}
                  className="rounded bg-[#dba84f] px-3 py-2 text-sm font-bold text-black hover:bg-[#e9bb68]"
                >
                  {connectStatus === 'pending' ? 'Connecting' : 'Connect MetaMask'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewAccount(undefined);
                closeWallet();
              }}
              className="absolute right-[0.625rem] top-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#303b68] hover:bg-[#3c487a]"
              aria-label="Close account selection"
            >
              <X className="h-6 w-6 text-[#91a5ff]" />
            </button>
          </div>

          <Accounts
            accounts={visibleAccounts}
            walletSource={walletSource}
            selectedAddressKey={selectedAddressKey}
            normalizedWorkingAddress={normalizedWorkingAddress}
            hardhatAccountsLoading={hardhatAccountsLoading}
            hardhatAccountsError={hardhatAccountsError}
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
          <ConnectNetworkButton
            showName={false}
            showSymbol={true}
            showChevron={true}
            showConnect={true}
            showDisconnect={false}
            showHoverBg={true}
          />
        </div>

        <Accounts
          accounts={visibleAccounts}
          walletSource={walletSource}
          selectedAddressKey={walletActiveAddressKey}
          normalizedWorkingAddress={normalizedWorkingAddress}
          hardhatAccountsLoading={hardhatAccountsLoading}
          hardhatAccountsError={hardhatAccountsError}
          onOpenAccountPanel={openAccountPanel}
          onSelectAccount={selectAccount}
        />
      </div>
    </div>
  );
}
