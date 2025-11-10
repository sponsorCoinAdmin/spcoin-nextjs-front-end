// File: components/views/ManageSponsorships/ManageAgents.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';
import rawAgents from './agents.json';
import ManageWalletList from './ManageWalletList';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageAgents({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
    () => setWalletCallBack(undefined)
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enriched = await loadAccounts(rawAgents as any);
        if (!alive) return;
        setWalletList(
          enriched.map(buildWalletObj).map((w) => ({
            ...w,
            name: w.name && w.name !== 'N/A' ? w.name : shortAddr((w as any).address),
            symbol: w.symbol ?? 'N/A',
          })) as WalletAccount[]
        );
      } catch {
        if (!alive) return;
        const fallback = (Array.isArray(rawAgents) ? rawAgents : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...(w as any), name: shortAddr((w as any).address) } as WalletAccount;
        });
        setWalletList(fallback);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setWalletCallBack = (w?: WalletAccount) => {
    ctx?.setExchangeContext((prev) => {
      if (!prev) return prev;
      return { ...prev, accounts: { ...prev.accounts, agentAccount: w } };
    }, 'ManageAgents:setWalletCallBack(w)');

    if (w) {
      openPanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL, 'ManageAgents:setWalletCallBack(w)');
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_AGENT_PANEL, 'ManageAgents:setWalletCallBack(undefined)');
    }
  };

  return (
    <ManageWalletList
      walletList={walletList}
      setWalletCallBack={setWalletCallBack}
      onClose={onClose}
      containerType={SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL}
    />
  );
}
