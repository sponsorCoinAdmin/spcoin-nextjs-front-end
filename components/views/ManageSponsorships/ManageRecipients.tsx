// File: components/views/ManageSponsorships/ManageRecipients.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure';

import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';
import rawRecipients from './recipients.json';

import ManageWalletList from './ManageWalletList';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageRecipients({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  // Local UI state (selection mirrors ManageAgents)
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | undefined>(undefined);
  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  // Track detail panel visibility (recipient detail)
  const detailOpen = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);

  // Clear selection if the detail panel closes (e.g., header close)
  useEffect(() => {
    if (!detailOpen) setSelectedWallet(undefined);
  }, [detailOpen]);

  // Allow header close to say “exit detail → list”
  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    () => setWalletCallBack(undefined)
  );

  // Resolve recipients once (same enrichment pattern as Agents)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enriched = await loadAccounts(rawRecipients as any);
        const built = enriched
          .map(buildWalletObj)
          .map((w) => ({
            ...w,
            name: w.name && w.name !== 'N/A' ? w.name : shortAddr((w as any).address),
            symbol: w.symbol ?? 'N/A',
          })) as WalletAccount[];
        if (alive) setWalletList(built);
      } catch {
        const fallback = (Array.isArray(rawRecipients) ? rawRecipients : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...(w as any), name: shortAddr((w as any).address) } as WalletAccount;
        });
        if (alive) setWalletList(fallback);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ✅ Callback: update ExchangeContext.accounts.recipientAccount and toggle MANAGE_RECIPIENT_PANEL
  const setWalletCallBack = (w?: WalletAccount) => {
    setSelectedWallet(w);
    alert(`ManageRecipients setWalletCallBack wallet = ${stringifyBigInt(w)}`)

    ctx?.setExchangeContext(
      (prev) => {
        const next = { ...prev, accounts: { ...prev.accounts, recipientAccount: w } };
        return next;
      },
      'ManageRecipients:setRecipientAccount'
    );

    if (w) {
      alert("OpenPanel called)")
      openPanel(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);
    }
  };

  // Always render the shared list; the detail panel renders elsewhere
  return (
    <ManageWalletList
      walletList={walletList}
      setWalletCallBack={setWalletCallBack}
      onClose={onClose}
      containerType={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}
    />
  );
}
