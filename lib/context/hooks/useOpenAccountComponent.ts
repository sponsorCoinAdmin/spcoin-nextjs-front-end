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
import { appendDebugTrace } from '@/lib/utils/debugTrace';

type AccountComponentMode =
  | SP_COIN_DISPLAY.ACTIVE_ACCOUNT
  | SP_COIN_DISPLAY.SPONSOR_ACCOUNT
  | SP_COIN_DISPLAY.RECIPIENT_ACCOUNT
  | SP_COIN_DISPLAY.AGENT_ACCOUNT;

export type { AccountComponentMode };

type OpenAccountComponentOptions = {
  account?: spCoinAccount;
  close?: () => void;
  mode?: AccountComponentMode;
  source?: string;
  suppressOverlayCloseReason?: string;
  suppressOverlayCloseSource?: string;
};

export default function useOpenAccountComponent() {
  const { openPanel, setPanelVisible } = usePanelTree();
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
      appendDebugTrace(`${source}:openAccountComponent`, {
        hasAccount: Boolean(account),
        mode,
        hasCloseCallback: Boolean(close),
      });

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

      appendDebugTrace(`${source}:openingAccountPanelParent`, {
        mode,
      });
      openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, `${source}:openAccountPanel`);
      setPanelVisible(SP_COIN_DISPLAY.ACCOUNT_LOGO, true, `${source}:showAccountLogo`);
      setPanelVisible(SP_COIN_DISPLAY.ACCOUNT_META_DATA, true, `${source}:showAccountMetaData`);

      close?.();
      appendDebugTrace(`${source}:openingAccountPanelMode`, {
        mode,
      });
      openPanel(mode, `${source}:setAccountMode`);
    },
    [openPanel, setActiveAccount, setAgentAccount, setRecipientAccount, setSponsorAccount],
  );
}
