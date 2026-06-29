// File: components/views/RadioOverlayPanels/WalletAccountsPanel.tsx
'use client';

import { useState } from 'react';

import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import Accounts from '@/lib/spCoinWallet/accounts';
import type { SpCoinWalletAccount } from '@/lib/spCoinWallet';
import { buildSpCoinAccount } from '@/lib/spCoinWallet/buildSpCoinAccount';
import { useWalletAccountsList } from '@/lib/spCoinWallet/useWalletAccountsList';

export default function WalletAccountsPanel() {
  const {
    walletSource,
    hardhatAccountsLoading,
    hardhatAccountsError,
    selectionRequest,
    selectAccount,
  } = useSpCoinWallet();

  const [, setActiveAccount] = useActiveAccount();
  const { closePanel } = usePanelTree();
  const openAccountComponent = useOpenAccountComponent();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { selectedAddressKey, normalizedWorkingAddress, visibleAccounts } = useWalletAccountsList();

  const handleSelectAccount = (account: SpCoinWalletAccount) => {
    selectAccount(account);
    if (!selectionRequest) {
      setActiveAccount(buildSpCoinAccount(account));
    }
    closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'WalletAccountsPanel:selectAndClose');
  };

  const handleOpenAccountPanel = (account: SpCoinWalletAccount) => {
    const nextAccount = buildSpCoinAccount(account);
    setActiveAccount(nextAccount);
    openAccountComponent({
      account: nextAccount,
      mode: SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
      source: 'WalletAccountsPanel',
    });
  };

  return (
    <PanelGate panel={SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT}>
      <div className="-mx-4">
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
        />
      </div>
    </PanelGate>
  );
}
