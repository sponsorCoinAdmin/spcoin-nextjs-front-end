// File: components/views/ManageSponsorships/ManageAgents.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';
import rawAgents from './agents.json';
import ManageWalletList from './ManageWalletList';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageAgents({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  // Local UI state
  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  // Allow header close to signal "exit detail → list"
  useRegisterDetailCloser(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL, () => setWalletCallBack(undefined));

  // Helper: shallow compare by ordered address list (case-insensitive)
  const isSameAgentList = (a: WalletAccount[], b: WalletAccount[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const ax = (a[i]?.address ?? '').toLowerCase();
      const bx = (b[i]?.address ?? '').toLowerCase();
      if (ax !== bx) return false;
    }
    return true;
  };

  // Resolve wallets once, and persist them into ExchangeContext.accounts.agentAccounts
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

        if (!alive) return;
        setWalletList(built);

        // Store agents array into ExchangeContext on load
        ctx?.setExchangeContext((prev) => {
          const current = prev?.accounts?.agentAccounts ?? [];
          if (isSameAgentList(current, built)) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              agentAccounts: built,
            },
          };
        }, 'ManageAgents:loadAgentAccounts');
      } catch {
        const fallback = (Array.isArray(rawAgents) ? rawAgents : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...(w as any), name: shortAddr((w as any).address) } as WalletAccount;
        });

        if (!alive) return;
        setWalletList(fallback);

        // Store fallback list as well
        ctx?.setExchangeContext((prev) => {
          const current = prev?.accounts?.agentAccounts ?? [];
          if (isSameAgentList(current, fallback)) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              agentAccounts: fallback,
            },
          };
        }, 'ManageAgents:loadAgentAccounts(fallback)');
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Callback: update selected agent and toggle MANAGE_AGENT_PANEL
  const setWalletCallBack = (w?: WalletAccount) => {
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
