'use client';

import { useCallback } from 'react';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { suppressNextOverlayClose } from '@/lib/context/exchangeContext/hooks/useOverlayCloseHandler';
import {
  useActiveAccount,
  useAgentAccount,
  useRecipientAccount,
  useSponsorAccount,
} from '@/lib/context/hooks/nestedHooks/useAccounts';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';

type AccountComponentMode =
  | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
  | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
  | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
  | SP_COIN_DISPLAY.AGENT_ACCOUNT;

type OpenAccountComponentOptions = {
  account?: spCoinAccount;
  close?: () => void;
  mode?: AccountComponentMode;
  source?: string;
  suppressOverlayCloseReason?: string;
  suppressOverlayCloseSource?: string;
};

export default function useOpenAccountComponent() {
  const { openPanel } = usePanelTree();
  const [, setActiveAccount] = useActiveAccount();
  const [, setSponsorAccount] = useSponsorAccount();
  const [, setRecipientAccount] = useRecipientAccount();
  const [, setAgentAccount] = useAgentAccount();

  return useCallback(
    ({
      account,
      close,
      mode = SP_COIN_DISPLAY.ACTIVE_ACCOUNT,
      source = 'useOpenAccountComponent',
      suppressOverlayCloseReason,
      suppressOverlayCloseSource,
    }: OpenAccountComponentOptions = {}) => {
      if (account) {
        if (mode === SP_COIN_DISPLAY.SPONSOR_ACCOUNT) setSponsorAccount(account);
        else if (mode === SP_COIN_DISPLAY.RECIPIENT_ACCOUNT) setRecipientAccount(account);
        else if (mode === SP_COIN_DISPLAY.AGENT_ACCOUNT) setAgentAccount(account);
        else setActiveAccount(account);
      }

      if (suppressOverlayCloseReason) {
        suppressNextOverlayClose(
          suppressOverlayCloseReason,
          suppressOverlayCloseSource ?? source,
        );
      }

      close?.();
      openPanel(mode, `${source}:setAccountMode`);
      openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, `${source}:openAccountPanel`);
    },
    [openPanel, setActiveAccount, setAgentAccount, setRecipientAccount, setSponsorAccount],
  );
}
