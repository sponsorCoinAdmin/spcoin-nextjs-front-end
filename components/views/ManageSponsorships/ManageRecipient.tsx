// File: components/views/ManageSponsorships/ManageRecipients.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';

import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { useRegisterDetailCloser } from '@/lib/context/exchangeContext/hooks/useHeaderController';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';
import rawRecipients from './recipients.json';

import ManageWalletList from './ManageWalletList';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageRecipients({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();
  const ctx = useContext(ExchangeContextState);

  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | undefined>(undefined);
  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  const detailOpen = usePanelVisible(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);

  useEffect(() => {
    if (!detailOpen) setSelectedWallet(undefined);
  }, [detailOpen]);

  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL,
    () => setWalletCallBack(undefined)
  );

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

  // Open ONLY the recipient detail panel (close others first)
  const openRecipientDetail = () => {
    try {
      [
        SP_COIN_DISPLAY.MANAGE_AGENT_PANEL,
        SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
        SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL, // list panel
        SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL,
        SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
      ].forEach(closePanel);
    } catch {}
    openPanel(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);
  };

  // ✅ Set context + open detail
  const setWalletCallBack = (w?: WalletAccount) => {
    setSelectedWallet(w);

    ctx?.setExchangeContext(
      (prev) => ({ ...prev, accounts: { ...prev.accounts, recipientAccount: w } }),
      'ManageRecipients:setRecipientAccount'
    );

    if (w) {
      openRecipientDetail();
    } else {
      closePanel(SP_COIN_DISPLAY.MANAGE_RECIPIENT_PANEL);
    }
  };

  return (
    <ManageWalletList
      walletList={walletList}
      setWalletCallBack={setWalletCallBack}
      onClose={onClose}
      containerType={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}
    />
  );
}
