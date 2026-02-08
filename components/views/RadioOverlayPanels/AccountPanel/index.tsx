// File: @/components/views/RadioOverlayPanels/AccountPanel/index.tsx
'use client';

import React, { useContext, useMemo } from 'react';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import DisplayInfo from './AccointInfo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_ACCOUNT_PANEL === 'true';
const debugLog = createDebugLogger('AccountPanelEmpty', DEBUG_ENABLED, false);

type Props = { onClose?: () => void };

type ActiveAccountMember = 'SPONSOR_ACCOUNT' | 'RECIPIENT_ACCOUNT' | 'AGENT_ACCOUNT' | 'NONE';

export default function AccountPanel(_props: Props) {
  // Parent panel visibility
  const vAccountPanel = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);

  // Read child visibility directly
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);

  const ctx = useContext(ExchangeContextState);
  const accounts = ctx?.exchangeContext?.accounts;

  // Derive activeMember from the actual visible child flags
  const activeMember: ActiveAccountMember = useMemo(() => {
    if (vActiveSponsor) return 'SPONSOR_ACCOUNT';
    if (vActiveRecipient) return 'RECIPIENT_ACCOUNT';
    if (vActiveAgent) return 'AGENT_ACCOUNT';
    return 'NONE';
  }, [vActiveSponsor, vActiveRecipient, vActiveAgent]);

  // Active wallet based on active child
  const activeWallet = useMemo(() => {
    if (!accounts) return undefined;

    if (activeMember === 'SPONSOR_ACCOUNT') return accounts.sponsorAccount;
    if (activeMember === 'RECIPIENT_ACCOUNT') return accounts.recipientAccount;
    if (activeMember === 'AGENT_ACCOUNT') return accounts.agentAccount;

    return undefined;
  }, [accounts, activeMember]);

  const isActiveAccount = !!activeWallet;

  // ✅ early return AFTER hooks
  if (!vAccountPanel) return null;

  if (!isActiveAccount) {
    debugLog.log?.('[empty]', {
      vAccountPanel,
      vActiveSponsor,
      vActiveRecipient,
      vActiveAgent,
      activeMember,
      hasAccounts: !!accounts,
      sponsorAddr: accounts?.sponsorAccount?.address,
      recipientAddr: accounts?.recipientAccount?.address,
      agentAddr: accounts?.agentAccount?.address,
    });
  }

  return (
    <div id="ACCOUNT_PANEL">
      {isActiveAccount ? (
        <DisplayInfo account={activeWallet as any} />
      ) : (
        <div className="p-4 text-sm text-slate-200">
          <p className="mb-2 font-semibold">No active account selected.</p>
          <p className="m-0">
            Select a <strong>Sponsor</strong>, <strong>Recipient</strong>, or <strong>Agent</strong> to manage.
          </p>
        </div>
      )}
    </div>
  );
}
