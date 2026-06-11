'use client';

import React, { useMemo, useState } from 'react';
import { useConnect } from 'wagmi';

import WalletConnectComponent from '@/components/views/Buttons/Connect/WalletConnectComponent';
import AccountRow from '@/lib/spCoinWallet/AccountRow';
import WalletHeader from '@/components/views/WalletHeader';
import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { STATUS, type spCoinAccount } from '@/lib/structure';
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

  const headerAccount: SpCoinWalletAccount | undefined = useMemo(() => {
    if (!normalizedWorkingAddress) return undefined;
    if (walletSource === 'hardhat') {
      return (
        hardhatAccounts.find(
          (a) => normalizeAddress(a.address) === normalizedWorkingAddress,
        ) ?? {
          address: session.signerAddress || session.activeAccountAddress || '',
          label: 'Active Account',
          source: 'hardhat' as const,
        }
      );
    }
    if (session.metamaskAuthorized && session.signerAddress) {
      return {
        address: session.signerAddress,
        label: 'MetaMask Active Account',
        source: 'metamask' as const,
      };
    }
    return undefined;
  }, [hardhatAccounts, normalizedWorkingAddress, session.signerAddress, session.activeAccountAddress, session.metamaskAuthorized, walletSource]);
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

  const handlePrimaryClose = () => {
    if (previewAccount) {
      setPreviewAccount(undefined);
      return;
    }
    closeWallet();
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
            'absolute left-1/2 top-1/2 flex h-[min(650px,calc(100vh-2rem))] w-[min(520px,calc(100vw-2rem))] flex-col -translate-x-1/2 -translate-y-1/2 overflow-hidden',
            'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
          ].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label="Select Network Account"
        >
          <WalletHeader
            mode="selection"
            networkTitle={currentNetworkTitle}
            appChainId={session.appChainId}
            selectionSummary={selectionSummary}
            walletSource={walletSource}
            hardhatAccountsLoading={hardhatAccountsLoading}
            connectStatus={connectStatus}
            onRefresh={() => void refreshHardhatAccounts()}
            onConnectMetaMask={() => void connectMetaMask()}
            onClose={handlePrimaryClose}
          />

          {headerAccount ? (
            <AccountRow
              account={headerAccount}
              isActiveMarker={true}
              selected={true}
              isCollapsed={false}
            />
          ) : null}

          <Accounts
            accounts={visibleAccounts}
            walletSource={walletSource}
            selectedAddressKey={selectedAddressKey}
            normalizedWorkingAddress={normalizedWorkingAddress}
            hardhatAccountsLoading={hardhatAccountsLoading}
            hardhatAccountsError={hardhatAccountsError}
            onOpenAccountPanel={openAccountPanel}
            onSelectAccount={handleSelectAccount}
            previewAccount={previewAccount}
            onClosePreview={() => setPreviewAccount(undefined)}
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

      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/35">
        <div
          className={[
          'absolute left-1/2 top-1/2 flex h-[min(650px,calc(100vh-2rem))] w-[min(520px,calc(100vw-2rem))] flex-col -translate-x-1/2 -translate-y-1/2 overflow-hidden',
          'rounded-[15px] border border-[#2e3654] bg-[#0b0e19] text-white shadow-2xl',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="SponsorCoin Wallet"
      >
        <WalletHeader
          mode="normal"
          onClose={handlePrimaryClose}
        />

        <div className="px-5 py-1.5">
          <WalletConnectComponent
            showName={false}
            showSymbol={true}
            showChevron={true}
            showConnect={true}
            showDisconnect={false}
            showHoverBg={true}
          />
        </div>

        {headerAccount ? (
          <AccountRow
            account={headerAccount}
            isActiveMarker={true}
            selected={true}
            isCollapsed={false}
          />
        ) : null}

        <Accounts
          accounts={visibleAccounts}
          walletSource={walletSource}
          selectedAddressKey={walletActiveAddressKey}
          normalizedWorkingAddress={normalizedWorkingAddress}
          hardhatAccountsLoading={hardhatAccountsLoading}
          hardhatAccountsError={hardhatAccountsError}
          onOpenAccountPanel={openAccountPanel}
          onSelectAccount={handleSelectAccount}
          previewAccount={previewAccount}
          onClosePreview={() => setPreviewAccount(undefined)}
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

    </div>
  );
}
