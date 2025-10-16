// File: components/views/ManageSponsorships/ManageAgent.tsx
'use client';

import React, { useCallback, useContext, useState } from 'react';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import ManageWallet from './ManageWallet';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo'; // ⬅️ add ToDo

type Props = { onClose?: () => void };

export default function ManageAgent({ onClose }: Props) {
  const { closePanel, openPanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  // Pull wallet from global context (selected via ManageAgents)
  const agentWallet = ctx?.exchangeContext?.accounts?.agentAccount;

  // ── ToDo overlay state + helper ───────────────────────────────
  const [showToDo, setShowToDo] = useState<boolean>(true);
  const showToDoOverlay = useCallback(() => setShowToDo(true), []);

  // Header close: bounce back to the list overlay
  const handleClose = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL);
    closePanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL);
    onClose?.();
  }, [openPanel, closePanel, onClose]);

  useRegisterDetailCloser(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL, handleClose);

  return (
    <>
      <ManageWallet wallet={agentWallet} />

      {showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => setShowToDo(false)}
        />
      )}
    </>
  );
}
