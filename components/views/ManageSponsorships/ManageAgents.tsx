// File: components/views/ManageSponsorships/ManageAgents.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';
import rawAgents from './agents.json';
import ManageWalletList from './ManageWalletList';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageAgents({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  // Local UI state (selection kept for future detail view wiring)
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | undefined>(undefined);
  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  // Track detail panel visibility
  const detailOpen = usePanelVisible(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL);

  // If detail panel is closed (via header X, etc.), clear local selection
  useEffect(() => {
    if (!detailOpen) setSelectedWallet(undefined);
  }, [detailOpen]);

  // Allow header close to signal "exit detail → list"
  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
    () => setWalletCallBack(undefined)
  );

  // Resolve wallets once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enriched = await loadAccounts(rawAgents as any);
        const built = enriched.map(buildWalletObj).map((w) => ({
          ...w,
          name: w.name && w.name !== 'N/A' ? w.name : shortAddr((w as any).address),
          symbol: w.symbol ?? 'N/A',
        })) as WalletAccount[];
        if (alive) setWalletList(built);
      } catch {
        const fallback = (Array.isArray(rawAgents) ? rawAgents : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...(w as any), name: shortAddr((w as any).address) } as WalletAccount;
        });
        if (alive) setWalletList(fallback);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ✅ Callback: update ExchangeContext.accounts.agentAccount and toggle MANAGE_AGENT_PANEL
  const setWalletCallBack = (w?: WalletAccount) => {
    setSelectedWallet(w);

    ctx?.setExchangeContext((prev) => {
      const next = { ...prev, accounts: { ...prev.accounts, agentAccount: w } };
      return next;
    }, 'ManageAgents:setAgentAccount');

    if (w) {
      openPanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL);
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL);
    }
  };

  // Always render the shared list (detail handled elsewhere)
  return (
    <ManageWalletList
      walletList={walletList}
      setWalletCallBack={setWalletCallBack}
      onClose={onClose}
      containerType={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL}
    />
  );
}
