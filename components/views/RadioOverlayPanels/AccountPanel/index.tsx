// File: @/components/views/RadioOverlayPanels/AccountPanel/index.tsx
'use client';

import React, { useContext, useMemo } from 'react';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ManageAccount from './ManageAccount';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

type Props = { onClose?: () => void };

type ActiveAccountMember = 'ACTIVE_SPONSOR' | 'ACTIVE_RECIPIENT' | 'ACTIVE_AGENT' | 'NONE';

export default function AccountPanel(_props: Props) {
  // Parent panel visibility
  const vAccountPanel = usePanelVisible(SP_COIN_DISPLAY.ACCOUNT_PANEL);

  // Read child visibility directly
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_SPONSOR);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_RECIPIENT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_AGENT);

  const ctx = useContext(ExchangeContextState);
  const accounts = ctx?.exchangeContext?.accounts;

  // Derive activeMember from the actual visible child flags
  const activeMember: ActiveAccountMember = useMemo(() => {
    if (vActiveSponsor) return 'ACTIVE_SPONSOR';
    if (vActiveRecipient) return 'ACTIVE_RECIPIENT';
    if (vActiveAgent) return 'ACTIVE_AGENT';
    return 'NONE';
  }, [vActiveSponsor, vActiveRecipient, vActiveAgent]);

  // Active wallet based on active child
  const activeWallet = useMemo(() => {
    if (!accounts) return undefined;

    if (activeMember === 'ACTIVE_SPONSOR') return accounts.sponsorAccount;
    if (activeMember === 'ACTIVE_RECIPIENT') return accounts.recipientAccount;
    if (activeMember === 'ACTIVE_AGENT') return accounts.agentAccount;

    return undefined;
  }, [accounts, activeMember]);

  const isActiveAccount = !!activeWallet;

  // ✅ early return AFTER hooks
  if (!vAccountPanel) return null;

  return (
    <div id="ACCOUNT_PANEL">
      {isActiveAccount ? (
        <ManageAccount account={activeWallet as any} />
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
