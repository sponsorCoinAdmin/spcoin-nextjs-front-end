// File: @/components/views/ManageSponsorships/ManageWalletList.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext, useRef } from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType, LIST_TYPE } from '@/lib/structure';
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import AddressSelect from '../AddressSelect';

type Props = {
  walletList: WalletAccount[];
  setWalletCallBack: (wallet?: WalletAccount) => void;

  /** REQUIRED: selector panel container type */
  containerType: SP_COIN_DISPLAY;

  /** Mandatory (temporary): determines which actions/columns this list should show */
  listType: LIST_TYPE;
};

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

export default function ManageWalletList({
  walletList,
  setWalletCallBack,
  containerType,
  listType,
}: Props) {
  const ctx = useContext(ExchangeContextState);

  // 🔎 Account type derived from containerType (enum label text)
  const accountType: AccountType = useMemo(() => {
    const key = (SP_COIN_DISPLAY as any)[containerType] as string | undefined;
    const upper = (key ?? '').toUpperCase();
    if (upper.includes('RECIPIENT')) return AccountType.RECIPIENT;
    if (upper.includes('SPONSOR')) return AccountType.SPONSOR;
    return AccountType.AGENT;
  }, [containerType]);

  // Just one mode for now, but keeps the shape consistent
  const [mode] = useState<'all' | 'recipients' | 'agents' | 'sponsors'>('all');

  // 🔴 ToDo overlay
  const [showToDo, setShowToDo] = useState<boolean>(false);
  const pendingClaimRef = useRef<{ type: AccountType; accountId: number } | null>(null);

  // Role label + id prefix from the enum name (for CSS scoping)
  const { roleLabel, idPrefix } = useMemo(() => {
    const key = (SP_COIN_DISPLAY as any)[containerType] as string | undefined;
    const upper = (key ?? '').toUpperCase();
    if (upper.includes('RECIPIENT')) return { roleLabel: 'Recipient', idPrefix: 'mr' };
    if (upper.includes('SPONSOR')) return { roleLabel: 'Sponsor', idPrefix: 'ms' };
    return { roleLabel: 'Agent', idPrefix: 'ma' };
  }, [containerType]);

  // For now, claim is the only implemented action. Unsponsor can be wired later.
  const claimRewards = useCallback((type: AccountType, accountId: number) => {
    pendingClaimRef.current = { type, accountId };
    setShowToDo(true);
  }, []);

  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const pending = pendingClaimRef.current ?? {
      type: accountType,
      accountId: -1,
    };

    const isTotal = pending.accountId < 0 || pending.accountId >= walletList.length;
    const row = isTotal ? undefined : walletList[pending.accountId];

    const addressText =
      row && typeof (row as any).address === 'string'
        ? (row as any).address
        : (() => {
            const a = (row as any)?.address as Record<string, unknown> | undefined;
            if (!a) return 'N/A';
            const cand = a['address'] ?? a['hex'] ?? a['bech32'] ?? a['value'] ?? a['id'];
            try {
              return cand ? String(cand) : JSON.stringify(a);
            } catch {
              return 'N/A';
            }
          })();

    const rowName = row?.name ?? (addressText ? shortAddr(addressText) : 'N/A');
    const rowAccount =
      (row as any)?.account ??
      (row as any)?.address ??
      (row as any)?.hex ??
      (row as any)?.bech32 ??
      (row as any)?.value ??
      (row as any)?.id ??
      'N/A';

    const label =
      pending.type === AccountType.ALL
        ? 'ALL'
        : `${pending.type.toString()}${isTotal ? '' : '(s)'}`;

    // eslint-disable-next-line no-alert
    alert(
      [
        'ToDo:(Not Yet Implemented)',
        listType === LIST_TYPE.SPONSOR_UNSPONSOR
          ? `Unsponsor ${label}`
          : `Claim ${label} Rewards`,
        isTotal ? 'From: Total' : `From: ${String(rowName)}`,
        isTotal ? 'From Account: (aggregate)' : `From Account: ${String(rowAccount)}`,
        `For account: ${connected ? connected.address : '(none connected)'}`,
      ].join('\n')
    );
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, walletList, listType]);

  // Scoped ids
  const wrapperId = `${idPrefix}Wrapper`;
  const tableId = `${idPrefix}Table`;

  // Styling helpers
  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 text-sm align-middle';
  const cellCenter = `${cell} text-center`;
  const rowH = 'h-[77px]';

  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';

  const actionHeaderLabel =
    listType === LIST_TYPE.SPONSOR_UNSPONSOR
      ? 'Unsponsor'
      : listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS
      ? 'Rewards'
      : 'Action';

  const actionButtonLabel =
    listType === LIST_TYPE.SPONSOR_UNSPONSOR
      ? 'Unsponsor'
      : listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS
      ? 'Claim'
      : 'Action';

  return (
    <>
      <AddressSelect
        defaultAddress={undefined}
        bypassDefaultFsm
        callingParent={'ManageWallet'}
        useActiveAddr={true}
        shortAddr={true}
        preText={'Deposit Account:'}
      />

      {mode === 'all' && (
        <>
          {/* Scoped styles for this instance (hide scrollbars, sticky header) */}
          <style jsx>{`
            #${wrapperId} {
              border-color: #000 !important;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            #${wrapperId}::-webkit-scrollbar {
              display: none;
            }
            #${tableId} thead tr,
            #${tableId} thead th {
              background-color: #2b2b2b !important;
            }
            #${tableId} thead tr {
              border-bottom: 1px solid #000 !important;
            }
            #${tableId} thead th {
              position: sticky;
              top: 0;
              z-index: 10;
            }
            #${tableId} tbody td {
              padding: 0 !important;
            }
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
          `}</style>

          {/* Scrollable list whose height is capped by viewport, like DataListSelect */}
          <div
            id={wrapperId}
            className="mb-0 -mt-[0px] max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto rounded-xl border border-black"
            data-list-type={LIST_TYPE[listType]}
          >
            <table id={tableId} className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th scope="col" className={th}>
                    Name
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Staked Coins
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    Pending Coins
                  </th>
                  <th scope="col" className={`${th} text-center`}>
                    {actionHeaderLabel}
                  </th>
                </tr>
              </thead>

              <tbody>
                {walletList.map((w, i) => {
                  const zebra = i % 2 === 0 ? zebraA : zebraB;
                  const actionClass = i % 2 === 0 ? 'ms-claim--orange' : 'ms-claim--green';

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
                        <button
                          type="button"
                          className={`${zebra} ${cell} ${rowH} flex flex-col items-center justify-center w-full hover:opacity-90 focus:outline-none`}
                          onClick={() => {
                            // eslint-disable-next-line no-console
                            console.debug('[ManageWalletList] row click', {
                              roleLabel,
                              containerType,
                              listType: LIST_TYPE[listType],
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
                          <Image
                            src={(w as any).logoURL || '/assets/miscellaneous/placeholder.png'}
                            alt={`${w.name ?? 'Wallet'} logo`}
                            width={53}
                            height={53}
                            className="h-[53px] w-[53px] object-contain rounded"
                          />
                          <div className="mt-1 text-xs text-slate-200 max-w-[130px] truncate text-center">
                            {w.name || shortAddr(addressText)}
                          </div>
                        </button>
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
                            className={actionClass}
                            aria-label={`${actionButtonLabel} for ${addressText}`}
                            onClick={() => claimRewards(accountType, i)}
                          >
                            {actionButtonLabel}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Total row */}
                {(() => {
                  const isA = walletList.length % 2 === 0;
                  const zebra = isA ? zebraA : zebraB;
                  const actionClass = isA ? 'ms-claim--orange' : 'ms-claim--green';

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
                            className={actionClass}
                            aria-label={`${actionButtonLabel} total`}
                            onClick={() => claimRewards(accountType, -1)}
                          >
                            {actionButtonLabel}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 🔴 ToDo overlay (click the red text to dismiss) */}
      {showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={doToDo}
        />
      )}
    </>
  );
}
