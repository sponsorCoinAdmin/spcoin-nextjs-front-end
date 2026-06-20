// File: components/views/RadioOverlayPanels/WalletAccountsPanel.tsx
'use client';

import { useState, useMemo } from 'react';

import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { normalizeAddress } from '@/lib/utils/address';
import { SP_COIN_DISPLAY, STATUS, type spCoinAccount } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import Accounts from '@/lib/spCoinWallet/accounts';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';

export default function WalletAccountsPanel() {
  const {
    session,
    walletSource,
    hardhatAccounts,
    hardhatAccountsLoading,
    hardhatAccountsError,
    selectionRequest,
    selectAccount,
  } = useSpCoinWallet();

  const [, setActiveAccount] = useActiveAccount();
  const { openPanel, closePanel } = usePanelTree();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [previewAccount, setPreviewAccount] = useState<spCoinAccount | undefined>(undefined);

  const selectedAddressKey = normalizeAddress(
    selectionRequest?.currentAddress || session.signerAddress || session.activeAccountAddress || '',
  );
  const normalizedWorkingAddress = normalizeAddress(
    session.signerAddress || session.activeAccountAddress || '',
  );
  const visibleAccounts = useMemo(() => {
    if (walletSource === 'hardhat') return hardhatAccounts;
    if (session.metamaskAuthorized && session.signerAddress) {
      return [{ address: session.signerAddress, label: 'MetaMask Active Account', source: 'metamask' as const }];
    }
    return [];
  }, [hardhatAccounts, session.metamaskAuthorized, session.signerAddress, walletSource]);

  const buildSpCoinAccount = (account: SpCoinWalletAccount): spCoinAccount => ({
    name: String(account.name || account.label || 'Unnamed account').trim(),
    symbol: String(account.symbol || '').trim(),
    type: 'account',
    website: '',
    description: '',
    status: STATUS.INFO,
    address: account.address as spCoinAccount['address'],
    ...(account.logoURL ? { logoURL: account.logoURL } : {}),
    balance: 0n,
  });

  const handleSelectAccount = (account: SpCoinWalletAccount) => {
    selectAccount(account);
    if (!selectionRequest) {
      setActiveAccount(buildSpCoinAccount(account));
    }
    closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'WalletAccountsPanel:selectAndClose');
  };

  const handleOpenAccountPanel = (account: SpCoinWalletAccount) => {
    setActiveAccount(buildSpCoinAccount(account));
    openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, 'WalletAccountsPanel:openAccountPanel');
  };

  return (
    <PanelGate panel={SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT}>
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Accounts
          accounts={visibleAccounts}
          walletSource={walletSource}
          selectedAddressKey={selectedAddressKey}
          normalizedWorkingAddress={normalizedWorkingAddress}
          isCollapsed={isCollapsed}
          hardhatAccountsLoading={hardhatAccountsLoading}
          hardhatAccountsError={hardhatAccountsError}
          onOpenAccountPanel={handleOpenAccountPanel}
          onSelectAccount={handleSelectAccount}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          previewAccount={previewAccount}
          onClosePreview={() => setPreviewAccount(undefined)}
        />
      </div>
    </PanelGate>
  );
}
