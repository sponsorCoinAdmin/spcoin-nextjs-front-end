// File: @/components/views/ManageSponsorships/ManageAgent.tsx
'use client';

import React, { useCallback, useContext, useState, useMemo } from 'react';
import Image from 'next/image';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import {
  useRegisterHeaderLeft,
  useRegisterHeaderTitle,
} from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import ManageWallet from './ManageWallet';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';
import { defaultMissingImage } from '@/lib/context/helpers/assetHelpers';

type Props = { onClose?: () => void };

export default function ManageAgent({ onClose }: Props) {
  const { closePanel, openPanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  const agentWallet = ctx?.exchangeContext?.accounts?.agentAccount;
  const logoURL = agentWallet?.logoURL;

  useRegisterHeaderTitle(
    SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
    `Agent ${agentWallet?.name ?? 'N/A'}`,
  );

  const resolvedLogo = useMemo(() => logoURL || defaultMissingImage, [logoURL]);

  useRegisterHeaderLeft(
    SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
    useMemo(
      () =>
        () => (
          <div className="relative -ml-2.5 m-0 h-10 w-10 shrink-0">
            <Image
              src={resolvedLogo}
              alt="Agent Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        ),
      [resolvedLogo],
    ),
  );

  const [showToDo, setShowToDo] = useState<boolean>(true);

  const handleClose = useCallback(() => {
    // This is still fine if you call it from an in-panel button.
    openPanel(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL, 'ManageAgent:handleClose()');
    closePanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL, 'ManageAgent:handleClose()');
    onClose?.();
  }, [openPanel, closePanel, onClose]);

  return (
    <div id="MANAGE_AGENT_PANEL">
      <ManageWallet wallet={agentWallet} />
      {!showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => setShowToDo(false)}
        />
      )}
    </div>
  );
}
