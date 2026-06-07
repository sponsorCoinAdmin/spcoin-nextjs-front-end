'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { RefreshCw, Wallet, X } from 'lucide-react';
import { useConnect } from 'wagmi';

import AccountComponent from '@/components/views/accountComponent';
import ConnectNetworkButton from '@/components/views/Buttons/Connect/ConnectNetworkButton';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
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
  const [, setActiveAccount] = useActiveAccount();
  const { connectAsync, connectors, status: connectStatus } = useConnect();
  const [previewAccount, setPreviewAccount] = useState<spCoinAccount | undefined>(undefined);
  const [traceEnabled, setTraceEnabled] = useState(false);
  const [traceOutput, setTraceOutput] = useState<string[]>([]);
  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );
  const walletActiveAddressKey = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
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

  const normalizedWorkingAddress = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
  );
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

  const trace = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
    console.log(logMessage);
    if (traceEnabled) {
      setTraceOutput((prev) => [...prev, logMessage]);
    }
  };

  const handleSelectAccount = (account: SpCoinWalletAccount) => {
    trace('handleSelectAccount called', {
      accountAddress: account.address,
      accountLabel: account.label,
      accountSource: account.source,
      selectionRequest: !!selectionRequest,
    });

    // Call the wallet context selectAccount to update wallet source
    trace('Calling selectAccount from context');
    selectAccount(account);

    // If not in selection mode, also set as active account
    if (!selectionRequest) {
      trace('Not in selection mode, setting active account');
      const nextActive: spCoinAccount = {
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
      
      trace('Built nextActive object', {
        name: nextActive.name,
        address: nextActive.address,
        symbol: nextActive.symbol,
      });
      
      trace('Calling setActiveAccount');
      setActiveAccount(nextActive);
      trace('setActiveAccount called, state update queued');
    } else {
      trace('In selection mode, skipping active account set');
    }
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

    trace('openAccountPanel called', {
      accountAddress: nextAccount.address,
      accountName: nextAccount.name,
      isSelectionMode,
    });

    trace('openAccountPanel using wallet preview mode', {
      accountAddress: nextAccount.address,
    });
    setPreviewAccount(nextAccount);
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
            onSelectAccount={handleSelectAccount}
          />

          {/* Trace Controls */}
          <div className="border-t border-slate-700/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wallet-trace-toggle"
                checked={traceEnabled}
                onChange={(e) => {
                  setTraceEnabled(e.target.checked);
                  if (!e.target.checked) setTraceOutput([]);
                }}
                className="h-4 w-4 cursor-pointer"
              />
              <label htmlFor="wallet-trace-toggle" className="text-sm text-[#91a5ff] cursor-pointer">
                Trace Selection
              </label>
            </div>
          </div>

          {/* Trace Output */}
          {traceEnabled && traceOutput.length > 0 && (
            <div className="border-t border-slate-700/50 px-5 py-3 max-h-48 overflow-y-auto bg-[#0a0d16]">
              <div className="text-xs font-mono text-[#7893ff] space-y-1">
                {traceOutput.map((line, idx) => (
                  <div key={idx} className="text-[#91a5ff]">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
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
          onSelectAccount={handleSelectAccount}
        />

        {/* Trace Controls */}
        <div className="border-t border-slate-700/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wallet-trace-toggle"
              checked={traceEnabled}
              onChange={(e) => {
                setTraceEnabled(e.target.checked);
                if (!e.target.checked) setTraceOutput([]);
              }}
              className="h-4 w-4 cursor-pointer"
            />
            <label htmlFor="wallet-trace-toggle" className="text-sm text-[#91a5ff] cursor-pointer">
              Trace Selection
            </label>
          </div>
        </div>

        {/* Trace Output */}
        {traceEnabled && traceOutput.length > 0 && (
          <div className="border-t border-slate-700/50 px-5 py-3 max-h-48 overflow-y-auto bg-[#0a0d16]">
            <div className="text-xs font-mono text-[#7893ff] space-y-1">
              {traceOutput.map((line, idx) => (
                <div key={idx} className="text-[#91a5ff]">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
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
