// File: components/views/ManageSponsorships/ManageWallet.tsx
'use client';

import React from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import AddressSelect from '@/components/views/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import cog_png from '@/public/assets/miscellaneous/cog.png';

type Props = {
  wallet?: WalletAccount; // <-- allow undefined (parent may not have one yet)
  onClose?: () => void;
  setWalletCallBack?: (wallet?: WalletAccount) => void;
};

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

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

export default function ManageWallet({ wallet, onClose, setWalletCallBack }: Props) {
  if (!wallet) return null; // nothing selected yet

  const prettyBalance =
    typeof wallet.balance === 'bigint' ? wallet.balance.toString() : String(wallet.balance ?? '0');

  return (
    <>
      <div className='mb-6'>
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            // ⬇️ Use the main radio panel id for this flow
            containerType={SP_COIN_DISPLAY.MANAGE_AGENT_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      <div className='rounded-xl border border-black/60 bg-slate-800/50 p-4 text-slate-100'>
        <div className='flex items-center gap-4'>
          <Image
            src={wallet.logoURL || '/assets/miscellaneous/placeholder.png'}
            alt={`${wallet.name ?? 'Wallet'} logo`}
            width={56}
            height={56}
            className='h-14 w-14 rounded object-contain'
          />
          <div className='flex-1 min-w-0'>
            <div className='text-lg font-semibold truncate'>
              {wallet.name || shortAddr(addressToText(wallet.address))}
            </div>
            <div className='text-xs text-slate-300 break-all'>
              {addressToText(wallet.address)}
            </div>
          </div>

          <button
            type='button'
            className='inline-flex h-9 w-9 items-center justify-center rounded hover:opacity-80 focus:outline-none'
            onClick={() => setWalletCallBack?.(wallet)}
            aria-label='Configure this wallet'
            title='Configure this wallet'
          >
            <span className='cog-white-mask cog-rot' aria-hidden />
          </button>
        </div>

        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <InfoRow label='Symbol' value={wallet.symbol ?? 'N/A'} />
          <InfoRow label='Type' value={wallet.type ?? 'N/A'} />
          <InfoRow
            label='Website'
            value={
              wallet.website ? (
                <a
                  href={wallet.website}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200'
                >
                  {wallet.website}
                </a>
              ) : (
                'N/A'
              )
            }
          />
          <InfoRow label='Status' value={String(wallet.status ?? 'N/A')} />
          <InfoRow label='Balance' value={prettyBalance} />
          <InfoRow label='Description' value={wallet.description || '—'} />
        </div>
      </div>

      <style jsx>{`
        .cog-white-mask {
          display: inline-block;
          width: 20px;
          height: 20px;
          background-color: #ffffff;
          -webkit-mask-image: url(${cog_png.src});
          mask-image: url(${cog_png.src});
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          -webkit-mask-size: contain;
          mask-size: contain;
        }
        .cog-rot { transition: transform 0.3s ease; }
        .cog-rot:hover { transform: rotate(360deg); }
      `}</style>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='rounded-lg border border-slate-600/50 bg-slate-900/40 p-3'>
      <div className='text-xs uppercase tracking-wide text-slate-400'>{label}</div>
      <div className='mt-1 text-sm text-slate-100 break-all'>{value}</div>
    </div>
  );
}
