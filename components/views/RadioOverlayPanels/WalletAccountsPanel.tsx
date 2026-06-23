// File: components/views/RadioOverlayPanels/WalletAccountsPanel.tsx
'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';

import { useSpCoinWallet } from '@/lib/spCoinWallet';
import { useActiveAccount } from '@/lib/context/hooks/ExchangeContext/nested/accounts/useActiveAccount';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import useOpenAccountComponent from '@/lib/context/hooks/useOpenAccountComponent';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import Accounts from '@/lib/spCoinWallet/accounts';
import ManageAccountsPanel from '@/components/wallet/panels/ManageAccountsPanel';
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
  const { closePanel, openPanel } = usePanelTree();
  const openAccountComponent = useOpenAccountComponent();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [previewAccount, setPreviewAccount] = useState<spCoinAccount | undefined>(undefined);

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
    setPreviewAccount(nextAccount);
    openAccountComponent({
      account: nextAccount,
      mode: SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
      source: 'WalletAccountsPanel',
    });
  };

  const handleManageClick = () => {
    openPanel(SP_COIN_DISPLAY.MANAGE_ACCOUNTS_PANEL, 'WalletAccountsPanel:manageAccounts');
  };

  return (
    <PanelGate panel={SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT}>
      <div className="-mx-4">
        <div className="flex items-center justify-end border-b border-slate-700/30 px-4 py-1">
          <button
            type="button"
            onClick={handleManageClick}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white"
            title="Manage accounts"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage
          </button>
        </div>
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
      <ManageAccountsPanel />
    </PanelGate>
  );
}
