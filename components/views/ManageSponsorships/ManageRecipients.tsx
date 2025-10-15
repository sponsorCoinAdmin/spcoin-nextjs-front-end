// File: components/views/ManageSponsorships/ManageRecipients.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import AddressSelect from '@/components/views/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';

// Enrichment + builder
import { loadAccounts } from '@/lib/spCoin/loadAccounts';
import { buildWalletObj } from '@/lib/utils/feeds/assetSelect/builders';

// Local JSON (addresses only) — recipients
import rawRecipients from './recipients.json';

// ✅ ToDo overlay
import ToDo from '@/lib/utils/components/ToDo';

type Props = { onClose?: () => void };

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageRecipients({ onClose }: Props) {
  const { openPanel, closePanel } = usePanelTree();

  // panel mode (kept for parity)
  const [mode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');

  // ▶ ToDo toggle (initialized to true)
  const [showToDo, setShowToDo] = useState<boolean>(true);

  const [wallets, setWallets] = useState<WalletAccount[]>([]);

  // Enrich + normalize addresses -> WalletAccount (with names if available)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enriched = await loadAccounts(rawRecipients as any);
        const built = enriched.map(buildWalletObj).map((w) => ({
          ...w,
          name: w.name && w.name !== 'N/A' ? w.name : shortAddr(w.address),
          symbol: w.symbol ?? 'N/A',
        }));
        if (alive) setWallets(built);
      } catch {
        const fallback = (Array.isArray(rawRecipients) ? rawRecipients : []).map((a: any) => {
          const w = buildWalletObj(a);
          return { ...w, name: shortAddr(w.address) };
        });
        if (alive) setWallets(fallback);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 text-sm align-middle';
  const cellCenter = `${cell} text-center`;
  const rowH = 'h-[77px]'; // fixed row height

  const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded hover:opacity-80 focus:outline-none';

  // zebra backgrounds on inner wrappers
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';   // A rows
  const zebraB = 'bg-[rgba(156,163,175,0.25)]'; // B rows (light gray)

  const openOnly = (id: SP_COIN_DISPLAY) => {
    try {
      [
        SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL,
        SP_COIN_DISPLAY.MANAGE_AGENTS_PANEL,
        SP_COIN_DISPLAY.MANAGE_SPONSORS_PANEL,
      ].forEach((pid) => (pid === id ? openPanel(pid) : closePanel(pid)));
    } catch {}
  };

  return (
    <>
      {/* Address selector */}
      <div className="mb-6">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      {mode === 'all' && (
        <div
          id="mrWrapper"
          className="mb-6 -mt-[10px] overflow-x-auto overflow-y-auto rounded-xl border border-black"
        >
          <table id="mrTable" className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-black">
                {/* ⬇️ Combined column */}
                <th scope="col" className={th}>Name</th>
                <th scope="col" className={`${th} text-center`}>Staked Coins</th>
                <th scope="col" className={`${th} text-center`}>Pending Coins</th>
                <th scope="col" className={`${th} text-center`}>Rewards</th>
                <th scope="col" className={`${th} text-center`}>Config</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w, i) => {
                const zebra = i % 2 === 0 ? zebraA : zebraB;
                const claimClass = i % 2 === 0 ? 'ms-claim--orange' : 'ms-claim--green';

                return (
                  <tr key={w.address}>
                    {/* Name column (Avatar + label stacked) */}
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cell} ${rowH} flex flex-col items-center justify-center`}
                      >
                        <Image
                          src={w.logoURL || '/assets/miscellaneous/placeholder.png'}
                          alt={`${w.name ?? 'Wallet'} logo`}
                          width={53}
                          height={53}
                          className="h-[53px] w-[53px] object-contain rounded"
                        />
                        <div className="mt-1 text-xs text-slate-200 max-w-[130px] truncate text-center">
                          {w.name || shortAddr(w.address)}
                        </div>
                      </div>
                    </td>

                    {/* Staked Coins */}
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        0
                      </div>
                    </td>

                    {/* Pending Coins */}
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        0
                      </div>
                    </td>

                    {/* Rewards (Claim) */}
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        <button
                          type="button"
                          className={claimClass}
                          aria-label={`Claim rewards for ${w.address}`}
                        >
                          Claim
                        </button>
                      </div>
                    </td>

                    {/* Config (Cog) */}
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() => openOnly(SP_COIN_DISPLAY.MANAGE_RECIPIENTS_PANEL)}
                          aria-label="Open Recipients reconfigure"
                          title="Reconfigure Recipient"
                        >
                          <span className="cog-white-mask cog-rot" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* ⬇️ Extra Total row (slightly smaller display); uses next zebra color + alternating Claim color */}
              {(() => {
                const isA = wallets.length % 2 === 0;
                const zebra = isA ? zebraA : zebraB;
                const claimClass = isA ? 'ms-claim--orange' : 'ms-claim--green';
                return (
                  <tr>
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cell} ${rowH} flex items-center justify-center`}
                      >
                        <span className="text-xl md:text-2xl font-bold tracking-wide">
                          Total
                        </span>
                      </div>
                    </td>
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        0
                      </div>
                    </td>
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        0
                      </div>
                    </td>
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        <button
                          type="button"
                          className={claimClass}
                          aria-label="Claim Total rewards"
                        >
                          Claim
                        </button>
                      </div>
                    </td>
                    <td className="p-0">
                      <div
                        className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}
                      >
                        {/* Intentionally blank (no cog) */}
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>

          {/* Styles: hide scrollbar, header styling, claim buttons, white cog */}
          <style jsx>{`
            #mrWrapper {
              border-color: #000 !important;
              -ms-overflow-style: none;  /* IE/Edge */
              scrollbar-width: none;     /* Firefox */
            }
            #mrWrapper::-webkit-scrollbar {
              display: none;             /* Chrome/Safari/Opera */
            }

            #mrTable thead tr,
            #mrTable thead th {
              background-color: #2b2b2b !important;
            }
            #mrTable thead tr {
              border-bottom: 1px solid #000 !important;
            }
            #mrTable tbody td {
              padding: 0 !important;
            }

            /* ORANGE claim buttons */
            #mrTable .ms-claim--orange {
              background-color: #ec8840ff !important;
              color: #0f172a !important;
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              transition: background-color 0.2s ease;
            }
            #mrTable .ms-claim--orange:hover {
              background-color: #c7610fff !important;
              color: #ffffff !important;
            }

            /* GREEN claim buttons */
            #mrTable .ms-claim--green {
              background-color: #147f3bff !important;
              color: #ffffff !important;
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              transition: background-color 0.2s ease;
            }
            #mrTable .ms-claim--green:hover {
              background-color: #22c55e !important;
              color: #0f172a !important;
            }

            /* White cog via PNG mask */
            #mrTable .cog-white-mask {
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
            #mrTable .cog-rot {
              transition: transform 0.3s ease;
            }
            #mrTable .cog-rot:hover {
              transform: rotate(360deg);
            }
          `}</style>
        </div>
      )}

      {/* 🔴 ToDo overlay (red text, click to dismiss) */}
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
