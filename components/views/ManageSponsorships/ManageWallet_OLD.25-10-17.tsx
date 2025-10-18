// File: components/views/ManageSponsorships/ManageWallet.tsx
'use client';

import React from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import AddressSelect from '@/components/views/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

type Props = {
  wallet?: WalletAccount;
  onClose?: () => void;
};

function addressToText(addr: unknown): string {
  if (addr == null) return 'N/A';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const a = addr as Record<string, unknown>;
    const candidates = [a['address'], a['hex'], a['bech32'], a['value'], a['id']].filter(Boolean) as string[];
    if (candidates.length > 0) return String(candidates[0]);
    try { return JSON.stringify(addr); } catch { return String(addr); }
  }
  return String(addr);
}

export default function ManageWallet({ wallet, onClose }: Props) {
  if (!wallet) return null;

  const addrText = addressToText(wallet.address);
  const prettyBalance =
    typeof wallet.balance === 'bigint' ? wallet.balance.toString() : String(wallet.balance ?? '0');

  return (
    <>
      <div className="mb-6">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={SP_COIN_DISPLAY.MANAGE_AGENT_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            {/* Prefill with the wallet address */}
            <AddressSelect defaultAddress={String(wallet.address)} />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      <div className="rounded-xl border border-black/60 bg-slate-800/50 p-4 text-slate-100">
        <div className="flex items-center gap-4">
          <Image
            src={wallet.logoURL || '/assets/miscellaneous/placeholder.png'}
            alt={`${wallet.name ?? 'Wallet'} logo`}
            width={56}
            height={56}
            className="h-14 w-14 rounded object-contain"
          />
          <div className="flex-1 min-w-0">
            {/* Title: Symbol (⬆ ~20%) */}
            <div className="font-semibold truncate text-[1.35rem]">
              {wallet.symbol ?? 'N/A'}
            </div>
            {/* Subline: Name (⬆ ~20%) */}
            <div className="text-slate-300 truncate text-[0.9rem]">
              {wallet.name || '—'}
            </div>
            {/* ⛔ Removed: address beside the icon */}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow
            label="Website"
            value={
              wallet.website ? (
                <a
                  href={wallet.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200 break-all"
                >
                  {wallet.website}
                </a>
              ) : (
                'N/A'
              )
            }
          />
          <InfoRow label="Balance" value={prettyBalance} />
          <InfoRow label="Description" value={wallet.description || '—'} />
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-600/50 bg-slate-900/40 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-slate-100 break-all">{value}</div>
    </div>
  );
}
