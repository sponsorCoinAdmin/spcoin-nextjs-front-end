// File: components/views/ManageSponsorships/ManageWalletList.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext } from 'react';
import Image from 'next/image';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType } from '@/lib/structure';
import AddressSelect from '@/components/views/AddressSelect';
import { AssetSelectDisplayProvider } from '@/lib/context/providers/AssetSelect/AssetSelectDisplayProvider';
import { AssetSelectProvider } from '@/lib/context/AssetSelectPanels/AssetSelectProvider';
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

type Props = {
  walletList: WalletAccount[];
  setWalletCallBack: (wallet?: WalletAccount) => void;
  onClose?: () => void;

  /** REQUIRED: selector panel container type */
  containerType: SP_COIN_DISPLAY;
};

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageWalletList({
  walletList,
  setWalletCallBack,
  onClose,
  containerType,
}: Props) {
  const ctx = useContext(ExchangeContextState);

  // 🔎 Mandatory account type derived from containerType (enum label text)
  const accountType: AccountType = useMemo(() => {
    const key = (SP_COIN_DISPLAY as any)[containerType] as string | undefined;
    const upper = (key ?? '').toUpperCase();
    if (upper.includes('RECIPIENT')) return AccountType.RECIPIENT;
    if (upper.includes('SPONSOR')) return AccountType.SPONSOR;
    return AccountType.AGENT;
  }, [containerType]);

  const [mode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');
  const [showToDo, setShowToDo] = useState<boolean>(true);

  // Derive role label + id prefix from the enum member name (robust to build differences)
  const { roleLabel, idPrefix } = useMemo(() => {
    const key = (SP_COIN_DISPLAY as any)[containerType] as string | undefined; // e.g., "AGENT_LIST_SELECT_PANEL"
    const upper = (key ?? '').toUpperCase();
    if (upper.includes('RECIPIENT')) return { roleLabel: 'Recipient', idPrefix: 'mr' };
    if (upper.includes('SPONSOR')) return { roleLabel: 'Sponsor', idPrefix: 'ms' };
    return { roleLabel: 'Agent', idPrefix: 'ma' };
  }, [containerType]);

  // 🛎️ Alert-only placeholder per request — includes account row context
  const claimRewards = useCallback(
    (type: AccountType, accountId: number) => {
      const connected = ctx?.exchangeContext?.accounts?.connectedAccount;

      const isTotal = accountId < 0 || accountId >= walletList.length;
      const row = isTotal ? undefined : walletList[accountId];

      const rowName = row?.name ?? (row?.address ? shortAddr(String((row as any).address)) : 'N/A');
      // Some lists may store address under different keys; try common fallbacks
      const rowAccount =
        (row as any)?.account ??
        (row as any)?.address ??
        (row as any)?.hex ??
        (row as any)?.bech32 ??
        (row as any)?.value ??
        (row as any)?.id ??
        'N/A';

      // eslint-disable-next-line no-alert
      alert(
        [
          'ToDo:(Not Yet Implemented)',
          `Claim ${type.toString()} Rewards`,
          isTotal ? 'From: Total' : `From: ${String(rowName)}`,
          isTotal ? 'From Account: (aggregate)' : `From Account: ${String(rowAccount)}`,
          `For account: ${connected ? connected.address : '(none connected)'}`,
        ].join('\n')
      );
    },
    [ctx?.exchangeContext?.accounts?.connectedAccount, walletList]
  );

  // Scoped ids to avoid CSS collisions across pages
  const wrapperId = `${idPrefix}Wrapper`;
  const tableId = `${idPrefix}Table`;

  // Table styling
  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 text-sm align-middle';
  const cellCenter = `${cell} text-center`;
  const rowH = 'h-[77px]';
  const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded hover:opacity-80 focus:outline-none';

  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';

  return (
    <>
      <div className="mb-6">
        <AssetSelectDisplayProvider>
          <AssetSelectProvider
            containerType={containerType}
            closePanelCallback={() => onClose?.()}
            setSelectedAssetCallback={() => {}}
          >
            <AddressSelect />
          </AssetSelectProvider>
        </AssetSelectDisplayProvider>
      </div>

      {mode === 'all' && (
        <div
          id={wrapperId}
          className="mb-6 -mt-[20px] overflow-x-auto overflow-y-auto rounded-xl border border-black"
        >
          <table id={tableId} className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th scope="col" className={th}>Name</th>
                <th scope="col" className={`${th} text-center`}>Staked Coins</th>
                <th scope="col" className={`${th} text-center`}>Pending Coins</th>
                <th scope="col" className={`${th} text-center`}>Rewards</th>
                <th scope="col" className={`${th} text-center`}>Config</th>
              </tr>
            </thead>
            <tbody>
              {walletList.map((w, i) => {
                const zebra = i % 2 === 0 ? zebraA : zebraB;
                const claimClass = i % 2 === 0 ? 'ms-claim--orange' : 'ms-claim--green';

                const addressText =
                  typeof (w as any).address === 'string'
                    ? (w as any).address
                    : (() => {
                        const a = (w as any)?.address as Record<string, unknown> | undefined;
                        if (!a) return 'N/A';
                        const cand =
                          a['address'] ?? a['hex'] ?? a['bech32'] ?? a['value'] ?? a['id'];
                        try {
                          return cand ? String(cand) : JSON.stringify(a);
                        } catch {
                          return 'N/A';
                        }
                      })();

                return (
                  <tr key={addressText}>
                    <td className="p-0">
                      <div className={`${zebra} ${cell} ${rowH} flex flex-col items-center justify-center`}>
                        <Image
                          src={w.logoURL || '/assets/miscellaneous/placeholder.png'}
                          alt={`${w.name ?? 'Wallet'} logo`}
                          width={53}
                          height={53}
                          className="h-[53px] w-[53px] object-contain rounded"
                        />
                        <div className="mt-1 text-xs text-slate-200 max-w-[130px] truncate text-center">
                          {w.name || shortAddr(addressText)}
                        </div>
                      </div>
                    </td>

                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>0</div>
                    </td>

                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>0</div>
                    </td>

                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>
                        <button
                          type="button"
                          className={claimClass}
                          aria-label={`Claim rewards for ${addressText}`}
                          onClick={() => claimRewards(accountType, i)}
                        >
                          Claim
                        </button>
                      </div>
                    </td>

                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>
                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() => {
                            // Helpful debug to verify click path per role
                            // eslint-disable-next-line no-console
                            console.debug('[ManageWalletList] cog click', {
                              roleLabel,
                              containerType,
                              address: addressText,
                              name: w?.name ?? 'N/A',
                            });
                            setWalletCallBack(w);
                          }}
                          aria-label={`Open ${roleLabel}s reconfigure`}
                          title={`Reconfigure ${roleLabel}`}
                          data-role={roleLabel}
                          data-address={addressText}
                        >
                          <span className="cog-white-mask cog-rot" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {(() => {
                const isA = walletList.length % 2 === 0;
                const zebra = isA ? zebraA : zebraB;
                const claimClass = isA ? 'ms-claim--orange' : 'ms-claim--green';
                return (
                  <tr>
                    <td className="p-0">
                      <div className={`${zebra} ${cell} ${rowH} flex items-center justify-center`}>
                        <span className="text-xl md:text-2xl font-bold tracking-wide">Total</span>
                      </div>
                    </td>
                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>0</div>
                    </td>
                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>0</div>
                    </td>
                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`}>
                        <button
                          type="button"
                          className={claimClass}
                          aria-label="Claim Total rewards"
                          onClick={() => claimRewards(accountType, -1)}
                        >
                          Claim
                        </button>
                      </div>
                    </td>
                    <td className="p-0">
                      <div className={`${zebra} ${cellCenter} ${rowH} flex items-center justify-center`} />
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>

          {/* Scoped styles via derived idPrefix */}
          <style jsx>{`
            #${wrapperId} { border-color: #000 !important; -ms-overflow-style: none; scrollbar-width: none; }
            #${wrapperId}::-webkit-scrollbar { display: none; }
            #${tableId} thead tr, #${tableId} thead th { background-color: #2b2b2b !important; }
            #${tableId} thead tr { border-bottom: 1px solid #000 !important; }
            #${tableId} tbody td { padding: 0 !important; }
            #${tableId} .ms-claim--orange {
              background-color: #ec8840ff !important;
              color: #0f172a !important;
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              transition: background-color 0.2s ease;
            }
            #${tableId} .ms-claim--orange:hover {
              background-color: #c7610fff !important;
              color: #ffffff !important;
            }
            #${tableId} .ms-claim--green {
              background-color: #147f3bff !important;
              color: #ffffff !important;
              padding: 0.375rem 0.75rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              transition: background-color 0.2s ease;
            }
            #${tableId} .ms-claim--green:hover {
              background-color: #22c55e !important;
              color: #0f172a !important;
            }
            #${tableId} .cog-white-mask {
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
            #${tableId} .cog-rot { transition: transform 0.3s ease; }
            #${tableId} .cog-rot:hover { transform: rotate(360deg); }
          `}</style>
        </div>
      )}

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
