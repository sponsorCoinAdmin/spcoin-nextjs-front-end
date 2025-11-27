// File: @/components/views/ManageSponsorships/ManageSponsors.tsx
'use client';

import React, { useEffect, useState, useContext } from 'react';
import type { WalletAccount } from '@/lib/structure';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
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

  // Local list state
  const [walletList, setWalletList] = useState<WalletAccount[]>([]);

  // Allow header close to signal "exit detail → list"
  useRegisterDetailCloser(
    SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
    () => setWalletCallBack(undefined)
  );

  // Resolve wallets once and store in ExchangeContext.accounts.sponsorAccounts
  useEffect(() => {
    let alive = true;

    const isSameList = (a: WalletAccount[], b: WalletAccount[]) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const ax = (a[i]?.address ?? '').toLowerCase();
        const bx = (b[i]?.address ?? '').toLowerCase();
        if (ax !== bx) return false;
      }
      return true;
    };

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

        if (!alive) return;

        setWalletList(built);

        // Write sponsors array into ExchangeContext if changed
        ctx?.setExchangeContext((prev) => {
          const current = prev?.accounts?.sponsorAccounts ?? [];
          if (isSameList(current, built)) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccounts: built,
            },
          };
        }, 'ManageSponsors:useEffect(loadSponsorAccounts)');
      } catch {
        const fallback = (Array.isArray(rawSponsors) ? rawSponsors : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...(w as any), name: shortAddr((w as any).address) } as WalletAccount;
        });

        if (!alive) return;

        setWalletList(fallback);

        // Fallback write to context
        ctx?.setExchangeContext((prev) => {
          const current = prev?.accounts?.sponsorAccounts ?? [];
          if (isSameList(current, fallback)) return prev;
          return {
            ...prev,
            accounts: {
              ...prev.accounts,
              sponsorAccounts: fallback,
            },
          };
        }, 'ManageSponsors:useEffect(loadSponsorAccounts(fallback))');
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Callback: update ExchangeContext.accounts.sponsorAccount and toggle MANAGE_SPONSOR_PANEL
  const setWalletCallBack = (w?: WalletAccount) => {
    ctx?.setExchangeContext(
      (prev) => {
        const next = { ...prev, accounts: { ...prev.accounts, sponsorAccount: w } };
        return next;
      },
      'ManageSponsors:setWalletCallBack(setSponsorAccount)'
    );

    if (w) {
      openPanel(
        SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
        'ManageSponsors:setWalletCallBack(open)'
      );
    } else {
      closePanel(
        SP_COIN_DISPLAY.MANAGE_SPONSOR_PANEL,
        'ManageSponsors:setWalletCallBack(close)'
      );
    }
  };

  // 🧩 Layout: mirror AssetListSelectPanel
  // AssetListSelectPanel:
  //   <div className="flex flex-col h-full w-full ... min-h-0">
  //     <AddressSelect />
  //     <DataListSelect ... />
  //   </div>
  //
  // Here:
  //   <div className="flex flex-col h-full w-full ... min-h-0">
  //     <ManageWalletList ... />   // (our "DataListSelect"-style child)
  //   </div>
  return (
    <div
      id="ManageSponsorsPanel"
      className="flex flex-col h-full w-full rounded-[15px] overflow-hidden min-h-0 gap-[4px]"
    >
      <div className="flex-1 min-h-0">
        <ManageWalletList
          walletList={walletList}
          setWalletCallBack={setWalletCallBack}
          containerType={SP_COIN_DISPLAY.SPONSOR_LIST_SELECT_PANEL}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
