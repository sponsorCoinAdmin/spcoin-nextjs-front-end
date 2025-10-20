// File: components/views/ManageSponsorships/ManageSponsors.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';

import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';
import rawSponsors from './sponsors.json';

import ManageWalletList from './ManageWalletList';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageSponsors({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  // Local UI state (selection kept for future detail view wiring)
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | undefined>(undefined);
  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  // Track sponsor detail panel visibility
  const detailOpen = usePanelVisible(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL);

  // If detail panel is closed (via header X, etc.), clear local selection
  useEffect(() => {
    if (!detailOpen) setSelectedWallet(undefined);
  }, [detailOpen]);

  // Allow header close to signal "exit detail → list"
  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
    () => setWalletCallBack(undefined)
  );

  // Resolve wallets once (mirror ManageAgents)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enriched = await loadAccounts(rawSponsors as any);
        const built = enriched
          .map(buildWalletObj)
          .map((w) => ({
            ...w,
            name: w.name && w.name !== 'N/A' ? w.name : shortAddr((w as any).address),
            symbol: w.symbol ?? 'N/A',
          })) as WalletAccount[];
        if (alive) setWalletList(built);
      } catch {
        const fallback = (Array.isArray(rawSponsors) ? rawSponsors : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...(w as any), name: shortAddr((w as any).address) } as WalletAccount;
        });
        if (alive) setWalletList(fallback);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ Callback: update ExchangeContext.accounts.sponsorAccount and toggle MANAGE_SPONSOR_PANEL
  const setWalletCallBack = (w?: WalletAccount) => {
    setSelectedWallet(w);

    // write to global context (mirror ManageAgents, but for sponsorAccount)
    ctx?.setExchangeContext(
      (prev) => {
        const next = { ...prev, accounts: { ...prev.accounts, sponsorAccount: w } };
        return next;
      },
      'ManageSponsors:setSponsorAccount'
    );

    if (w) {
      openPanel(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL);
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL);
    }
  };

  // Always render the shared list (detail panel renders elsewhere)
  return (
    <ManageWalletList
      walletList={walletList}
      setWalletCallBack={setWalletCallBack}
      containerType={SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL}
      onClose={onClose}
    />
  );
}
