// File: @/components/views/ManageSponsorships/ManageWalletList.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext, useRef } from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType, LIST_TYPE } from '@/lib/structure';
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import AddressSelect from '../AssetSelectPanels/AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { msTableTw } from './msTableTw';

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
  const [tip, setTip] = useState<{ show: boolean; text: string; x: number; y: number }>({
    show: false,
    text: '',
    x: 0,
    y: 0,
  });

  // Role label + id prefix from the enum name (for scoping ids only)
  const { roleLabel, idPrefix } = useMemo(() => {
    const key = (SP_COIN_DISPLAY as any)[containerType] as string | undefined;
    const upper = (key ?? '').toUpperCase();
    const derived = upper.includes('RECIPIENT')
      ? { roleLabel: 'Recipient', idPrefix: 'mr' }
      : upper.includes('SPONSOR')
        ? { roleLabel: 'Recipient', idPrefix: 'ms' }
        : { roleLabel: 'Agent', idPrefix: 'ma' };

    debugLog.log?.('[derive roleLabel/idPrefix]', {
      containerType,
      containerLabel: key ?? 'UNKNOWN',
      upper,
      derived,
    });

    return derived;
  }, [containerType]);

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
    const pending = pendingClaimRef.current ?? { type: accountType, accountId: -1 };

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
      pending.type === AccountType.ALL ? 'ALL' : `${pending.type.toString()}${isTotal ? '(s)' : ''}`;

    // eslint-disable-next-line no-alert
    const msg = [
      'ToDo: (Not Yet Implemented)\n',
      `────────────────────────────────────────────────────────\n`,
      `Unstake and Return Tokens back to Sponsors Trading Pool.\n`,
      `────────────────────────────────────────────────────────\n`,
      listType === LIST_TYPE.SPONSOR_UNSPONSOR ? `Unsponsor ${label} ` : `Claim ${label} Rewards`,
      isTotal ? '${label} Total' : `${String(rowName)}\n`,
      isTotal ? 'Total Accounts: (aggregate)' : `Account: ${String(rowAccount)}\n`,
      `From SPONSOR Account: ${connected ? connected.address : '(not connected)\n'}`,
    ].join('');

    debugLog.log?.(msg);
    // eslint-disable-next-line no-alert
    alert(msg);
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, walletList, listType]);

  // Scoped ids (kept, but no CSS usage)
  const wrapperId = `${idPrefix}Wrapper`;

  // Prevent wrapper from pulling upward into AddressSelect
  const wrapperTw =
    `${msTableTw.wrapper} !mt-0 mt-0 ` +
    'mt-3 mb-0 max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto';

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

      {/* Tooltip */}
      {tip.show && tip.text ? (
        <div
          className="fixed z-[9999] pointer-events-none bg-white text-black px-[10px] py-[6px] rounded-lg text-[12px] leading-[1.2] shadow-lg max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, -120%)' }}
        >
          {tip.text}
        </div>
      ) : null}

      <div id={wrapperId} className={wrapperTw} data-list-type={LIST_TYPE[listType]}>
        <table className={`min-w-full ${msTableTw.table}`}>
          <thead>
            <tr className={`${msTableTw.theadRow} sticky top-0 z-20`}>
              <th
                scope="col"
                className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${msTableTw.colFit} sticky top-0 z-20 bg-[#1f2639]`}
              >
                {roleLabel}
              </th>

              <th
                scope="col"
                className={`${msTableTw.th} ${msTableTw.thPad3} text-center sticky top-0 z-20 bg-[#1f2639]`}
              >
                {middleHeaderLabel}
              </th>

              <th
                scope="col"
                className={`${msTableTw.th5} ${msTableTw.th5Pad3} text-center ${msTableTw.colFit} sticky top-0 z-20 bg-[#1f2639]`}
              >
                {actionHeaderLabel}
              </th>
            </tr>
          </thead>


          <tbody>
            {walletList.map((w, i) => {
              const zebra = i % 2 === 0 ? msTableTw.rowA : msTableTw.rowB;
              const actionTw = i % 2 === 0 ? msTableTw.btnOrange : msTableTw.btnGreen;

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
                <tr key={addressText} className={msTableTw.rowBorder}>
                  {/* Column 1 (already correct) */}
                  <td className="p-0">
                    <button
                      type="button"
                      className={`${zebra} ${msTableTw.tdInnerCenter5} w-full flex-col hover:opacity-90 focus:outline-none`}
                      onMouseEnter={() => onRowEnter(w?.name ?? '')}
                      onMouseMove={onRowMove}
                      onMouseLeave={onRowLeave}
                      onClick={() => setWalletCallBack(w)}
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

                  {/* Column 2 */}
                  <td className={`${zebra} px-3 text-sm align-middle`}>
                    <div className="w-full flex items-center justify-center bg-transparent">0</div>
                  </td>

                  {/* Column 3 (✅ +3px right padding) */}
                  <td className={`${zebra} pl-[5px] pr-[8px] text-sm align-middle`}>
                    <div className="w-full flex items-center justify-center bg-transparent">
                      <button
                        type="button"
                        className={actionTw}
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
              const zebra = isA ? msTableTw.rowA : msTableTw.rowB;
              const actionTw = isA ? msTableTw.btnOrange : msTableTw.btnGreen;

              return (
                <tr className={msTableTw.rowBorder}>
                  <td className={`${zebra} pl-[5px] pr-[8px] text-sm align-middle`}>
                    <div className="w-full flex items-center justify-center bg-transparent">
                      <span className="text-xl md:text-2xl font-bold tracking-wide">Total</span>
                    </div>
                  </td>

                  {/* Column 2 (Total) */}
                  <td className={`${zebra} px-3 text-sm align-middle`}>
                    <div className="w-full flex items-center justify-center bg-transparent">0</div>
                  </td>

                  {/* Column 3 (Total) (✅ +3px right padding) */}
                  <td className={`${zebra} pl-[5px] pr-[8px] text-sm align-middle`}>
                    <div className="w-full flex items-center justify-center bg-transparent">
                      <button
                        type="button"
                        className={actionTw}
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

      {showToDo && (
        <ToDo show message="ToDo" opacity={0.5} color="#ff1a1a" zIndex={2000} onDismiss={doToDo} />
      )}
    </>
  );
}
