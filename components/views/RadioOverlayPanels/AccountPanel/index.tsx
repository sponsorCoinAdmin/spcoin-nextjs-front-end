// File: components/views/RadioOverlayPanels/AccountPanel/index.tsx
'use client';

import React, { useContext, useMemo } from 'react';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';

import AccountPanelView from './AccountPanelView';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_ACCOUNT_PANEL === 'true';
const debugLog = createDebugLogger('AccountPanelEmpty', DEBUG_ENABLED, false);

type Props = { onClose?: () => void };

type ActiveAccountMember =
  | 'ACTIVE_ACCOUNT'
  | 'SPONSOR_ACCOUNT'
  | 'RECIPIENT_ACCOUNT'
  | 'AGENT_ACCOUNT'
  | 'NONE';

export default function AccountPanel(_props: Props) {
  const vAccountPanel = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);
  const vActiveAccount = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_ACCOUNT);
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);

  const ctx = useContext(ExchangeContextState);
  const accounts = ctx?.exchangeContext?.accounts;

  const activeMember: ActiveAccountMember = useMemo(() => {
    if (vActiveAccount) return 'ACTIVE_ACCOUNT';
    if (vActiveSponsor) return 'SPONSOR_ACCOUNT';
    if (vActiveRecipient) return 'RECIPIENT_ACCOUNT';
    if (vActiveAgent) return 'AGENT_ACCOUNT';
    return 'NONE';
  }, [vActiveAccount, vActiveSponsor, vActiveRecipient, vActiveAgent]);

  const selectedRoleAccount = useMemo<spCoinAccount | undefined>(() => {
    if (!accounts) return undefined;
    if (activeMember === 'ACTIVE_ACCOUNT') return accounts.activeAccount;
    if (activeMember === 'SPONSOR_ACCOUNT') return accounts.sponsorAccount;
    if (activeMember === 'RECIPIENT_ACCOUNT') return accounts.recipientAccount;
    if (activeMember === 'AGENT_ACCOUNT') return accounts.agentAccount;
    return accounts.activeAccount;
  }, [accounts, activeMember]);

  const selectedAccount = selectedRoleAccount ?? accounts?.activeAccount;
  const effectiveMember: ActiveAccountMember = selectedRoleAccount ? activeMember : 'ACTIVE_ACCOUNT';

  const contentMode =
    effectiveMember === 'SPONSOR_ACCOUNT'
      ? SP_COIN_DISPLAY.SPONSOR_ACCOUNT
      : effectiveMember === 'RECIPIENT_ACCOUNT'
        ? SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
        : effectiveMember === 'AGENT_ACCOUNT'
          ? SP_COIN_DISPLAY.AGENT_ACCOUNT
          : SP_COIN_DISPLAY.ACTIVE_ACCOUNT;

  if (!vAccountPanel) return null;

  if (!selectedAccount) {
    debugLog.log?.('[empty]', {
      vAccountPanel,
      vActiveAccount,
      vActiveSponsor,
      vActiveRecipient,
      vActiveAgent,
      activeMember,
      effectiveMember,
      hasAccounts: !!accounts,
      activeAddr: accounts?.activeAccount?.address,
      selectedRoleAddr: selectedRoleAccount?.address,
      selectedAddr: (selectedAccount as spCoinAccount | undefined)?.address,
    });
  }

  return <AccountPanelView account={selectedAccount} mode={contentMode} />;
}
