'use client';

import React, { useCallback } from 'react';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useExchangeContext } from '@/lib/context/hooks';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import PanelGate from '@/components/utility/PanelGate';
import AccountSelectDropDown from '@/components/views/TradingStationPanel/AssetSelectDropDowns/AccountSelectDropDown';
import RoleTableComponent from '@/components/shared/RoleTableComponent';

export default function PanelSubTitle() {
  const { exchangeContext } = useExchangeContext();
  const { openPanel, closePanel } = usePanelTree();
  const walletAccountsVisible = usePanelVisible(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT);

  const activeAccount = exchangeContext?.accounts?.activeAccount;

  const handleSelectClick = useCallback((_e: React.SyntheticEvent) => {
    if (walletAccountsVisible) {
      closePanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'PanelSubTitle:chevron:close');
    } else {
      openPanel(SP_COIN_DISPLAY.WALLET_ACCOUNTS_COMPONENT, 'PanelSubTitle:chevron:open');
    }
  }, [walletAccountsVisible, openPanel, closePanel]);

  return (
    <PanelGate panel={SP_COIN_DISPLAY.PANEL_SUB_TITLE} lazyLoad={false}>
      <div>
        <div className="shrink-0 border-b border-slate-700/50 pl-4 pr-4 pb-2 flex items-center gap-2 bg-[#77808e]">
          <AccountSelectDropDown
            recipientAccount={activeAccount}
            onSelectClick={handleSelectClick}
          />
          <div className="ml-auto flex items-center gap-2">
            <PanelGate panel={SP_COIN_DISPLAY.ROLE_TABLE_COMPONENT}>
              <RoleTableComponent account={activeAccount} />
            </PanelGate>
          </div>
        </div>
      </div>
    </PanelGate>
  );
}
