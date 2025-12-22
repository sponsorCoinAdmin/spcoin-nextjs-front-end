// File: @/components/views/ManageSponsorships/ManageWalletList.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext, useRef } from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType, LIST_TYPE } from '@/lib/structure';
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import AddressSelect from '../AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ✅ Use the requested debug logger config
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

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
    const derived = upper.includes('RECIPIENT')
      ? AccountType.AGENT
      : upper.includes('SPONSOR')
        ? AccountType.SPONSOR
        : AccountType.RECIPIENT;

    debugLog.log?.('[derive accountType]', {
      containerType,
      containerLabel: key ?? 'UNKNOWN',
      upper,
      derived,
    });

    return derived;
  }, [containerType]);

  // 🔴 ToDo overlay
  const [showToDo, setShowToDo] = useState<boolean>(false);
  const pendingClaimRef = useRef<{ type: AccountType; accountId: number } | null>(null);

  // ✅ Single tooltip (white bg + black text) positioned above cursor
  const [tip, setTip] = useState<{ show: boolean; text: string; x: number; y: number }>(
    {
      show: false,
      text: '',
      x: 0,
      y: 0,
    },
  );

  // Role label + id prefix from the enum name (for CSS scoping)
  const { roleLabel, idPrefix } = useMemo(() => {
    const key = (SP_COIN_DISPLAY as any)[containerType] as string | undefined;
    const upper = (key ?? '').toUpperCase();
    const derived = upper.includes('RECIPIENT')
      ? { roleLabel: 'Recipient', idPrefix: 'mr' }
      : upper.includes('SPONSOR')
        ? { roleLabel: 'Sponsor', idPrefix: 'ms' }
        : { roleLabel: 'Agent', idPrefix: 'ma' };

    debugLog.log?.('[derive roleLabel/idPrefix]', {
      containerType,
      containerLabel: key ?? 'UNKNOWN',
      upper,
      derived,
    });

    return derived;
  }, [containerType]);

  // For now, claim is the only implemented action. Unsponsor can be wired later.
  const claimRewards = useCallback(
    (type: AccountType, accountId: number) => {
      debugLog.log?.('[claimRewards] set pending', {
        type,
        typeLabel: AccountType[type] ?? String(type),
        accountId,
        walletListLen: walletList.length,
        listType,
        listTypeLabel: LIST_TYPE[listType],
        containerType,
        containerLabel: SP_COIN_DISPLAY[containerType],
      });

      pendingClaimRef.current = { type, accountId };
      setShowToDo(true);
    },
    [walletList.length, listType, containerType],
  );

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

    // ✅ THIS is the label you're chasing
    const label =
      pending.type === AccountType.ALL
        ? 'ALL'
        : `${pending.type.toString()}${isTotal ? '(s)' : ''}`;

    debugLog.log?.('[doToDo] pending → label breakdown', {
      // inputs
      listType,
      listTypeLabel: LIST_TYPE[listType],
      accountType,
      accountTypeLabel: AccountType[accountType] ?? String(accountType),
      pendingRef: pendingClaimRef.current,
      pending,
      pendingTypeLabel: AccountType[pending.type] ?? String(pending.type),
      pendingAccountId: pending.accountId,
      walletListLen: walletList.length,

      // derived
      isTotal,
      selectedRowIndex: isTotal ? null : pending.accountId,
      selectedRowName: row?.name ?? null,
      selectedRowAddressPreview:
        typeof addressText === 'string' ? addressText.slice(0, 12) : String(addressText),

      // output
      label,
      actionText:
        listType === LIST_TYPE.SPONSOR_UNSPONSOR
          ? `Unsponsor ${label}`
          : `Claim ${label} Rewards`,

      // context
      connectedActive: connected ? { address: connected.address } : null,
    });

    // eslint-disable-next-line no-alert
    const msg = [
      'ToDo: (Not Yet Implemented)\n',
      `────────────────────────────────────────────────────────\n`,
      `Unstake and Return Tokens back to Sponsors Trading Pool.\n`,
      `────────────────────────────────────────────────────────\n`,
      listType === LIST_TYPE.SPONSOR_UNSPONSOR
        ? `Unsponsor ${label} `
        : `Claim ${label} Rewards`,
      isTotal ? '${label} Total' : `${String(rowName)}\n`,
      isTotal ? 'Total Accounts: (aggregate)' : `Account: ${String(rowAccount)}\n`,
      `From SPONSOR Account: ${connected ? connected.address : '(not connected)\n'}`,
    ].join('');

    debugLog.log?.(msg);
    // eslint-disable-next-line no-alert
    alert(msg);
}, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, walletList, listType]);

// Scoped ids
const wrapperId = `${idPrefix}Wrapper`;
const tableId = `${idPrefix}Table`;

// Styling helpers
const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
const cell = 'px-3 text-sm align-middle';
const cellCenter = `${cell} text-center`;

const zebraA = 'bg-[rgba(56,78,126,0.35)]';
const zebraB = 'bg-[rgba(156,163,175,0.25)]';

// ✅ 3-column layout: (Logo) | (Staked/Pending) | Action
const middleHeaderLabel =
  listType === LIST_TYPE.SPONSOR_UNSPONSOR
    ? 'Staked Coins'
    : listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS
      ? 'Pending Coins'
      : 'Coins';

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

const onRowEnter = (name?: string | null) => {
  setTip((t) => ({ ...t, show: true, text: name ?? '' }));
};

const onRowMove: React.MouseEventHandler = (e) => {
  setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
};

const onRowLeave = () => {
  setTip((t) => ({ ...t, show: false }));
};

// Snapshot per render (cheap + useful)
debugLog.log?.('[render snapshot]', {
  showToDo,
  roleLabel,
  idPrefix,
  containerType,
  containerLabel: SP_COIN_DISPLAY[containerType],
  listType,
  listTypeLabel: LIST_TYPE[listType],
  walletListLen: walletList.length,
  pendingRef: pendingClaimRef.current,
});

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

    {/* ✅ No mode gating yet: always render the list */}
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

          /* ✅ Fix FIRST row (header) height to 49px */
          #${tableId} thead tr,
          #${tableId} thead th {
            height: 49px !important;
          }

          /* ✅ Center text in header + total row cells */
          #${tableId} thead th {
            text-align: center !important;
          }
          #${tableId} tr.mw-total-row td {
            text-align: center !important;
          }

          #${tableId} tbody td {
            padding: 0 !important;
          }

          /* ✅ Fix LAST row (Total) height to 49px */
          #${tableId} tr.mw-total-row td,
          #${tableId} tr.mw-total-row td > * {
            height: 49px !important;
          }

          /* ✅ Make first + last column fit content (not stretch) */
          #${tableId} th:first-child,
          #${tableId} td:first-child {
            width: 1%;
            white-space: nowrap;
          }
          #${tableId} th:last-child,
          #${tableId} td:last-child {
            width: 1%;
            white-space: nowrap;
          }

          /* ✅ First-column inner padding buffers (1px) */
          #${tableId} .mw-firstpad {
            padding-left: 1px !important;
            padding-right: 1px !important;
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

          /* ✅ Single tooltip (white bg, black text) */
          .mw-tooltip {
            position: fixed;
            z-index: 9999;
            pointer-events: none;
            background: #ffffff;
            color: #000000;
            padding: 6px 10px;
            border-radius: 8px;
            font-size: 12px;
            line-height: 1.2;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
            transform: translate(-50%, -120%);
            max-width: 260px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>

      {/* Tooltip */}
      {tip.show && tip.text ? (
        <div className="mw-tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.text}
        </div>
      ) : null}

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
                Logo
              </th>
              <th scope="col" className={`${th} text-center`}>
                {middleHeaderLabel}
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
                    const cand = a['address'] ?? a['hex'] ?? a['bech32'] ?? a['value'] ?? a['id'];
                    try {
                      return cand ? String(cand) : JSON.stringify(a);
                    } catch {
                      return 'N/A';
                    }
                  })();

              return (
                <tr key={addressText}>
                  <td className={`${zebra} p-0`}>
                    <button
                      type="button"
                      className={`mw-firstpad ${cell} w-full inline-flex flex-col items-center justify-center hover:opacity-90 focus:outline-none`}
                      onMouseEnter={() => onRowEnter(w?.name ?? '')}
                      onMouseMove={onRowMove}
                      onMouseLeave={onRowLeave}
                      onClick={() => {
                        debugLog.log?.('[row click]', {
                          roleLabel,
                          containerType,
                          containerLabel: SP_COIN_DISPLAY[containerType],
                          listType,
                          listTypeLabel: LIST_TYPE[listType],
                          rowIndex: i,
                          address: addressText,
                          name: w?.name ?? 'N/A',
                        });
                        setWalletCallBack(w);
                      }}
                      aria-label={`Open ${roleLabel}s reconfigure`}
                      data-role={roleLabel}
                      data-address={addressText}
                    >
                      <Image
                        src={(w as any).logoURL || '/assets/miscellaneous/placeholder.png'}
                        alt={`${w.name ?? 'Wallet'} logo`}
                        width={53}
                        height={53}
                        className="h-[60px] w-[53px] px-[5px] object-contain rounded"
                      />
                    </button>
                  </td>

                  <td className={`${zebra} p-0`}>
                    <div className={`${cellCenter} flex items-center justify-center`}>0</div>
                  </td>

                  <td className={`${zebra} p-0`}>
                    <div className={`${cellCenter} flex items-center justify-center`}>
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
                <tr className="mw-total-row">
                  <td className={`${zebra} p-0`}>
                    <div className={`mw-firstpad ${cell} w-full inline-flex items-center justify-center`}>
                      <span className="text-xl md:text-2xl font-bold tracking-wide ml-[2px]">Total</span>
                    </div>
                  </td>
                  <td className={`${zebra} p-0`}>
                    <div className={`${cellCenter} flex items-center justify-center`}>0</div>
                  </td>
                  <td className={`${zebra} p-0`}>
                    <div className={`${cellCenter} flex items-center justify-center`}>
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

