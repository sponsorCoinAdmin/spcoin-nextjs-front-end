// File: @/components/views/RadioOverlayPanels/AccountListRewardsPanel.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext, useRef } from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType, LIST_TYPE } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
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

type PendingClaim = {
  type: AccountType;
  accountId: number;
  label?: string;
};

function shortAddr(addr: string, left = 6, right = 4) {
  const a = String(addr);
  return a.length > left + right ? `${a.slice(0, left)}…${a.slice(-right)}` : a;
}

/**
 * Uses panel visibility to decide which “mode” is active (for AddressSelect label only).
 * Priority: AGENTS > RECIPIENTS > SPONSORS > fallback
 */
function getInputAccountText(opts: {
  vAgents: boolean;
  vRecipients: boolean;
  vSponsors: boolean;
}): string {
  if (opts.vAgents) return 'Agent Account:';
  if (opts.vRecipients) return 'Recipient Account:';
  if (opts.vSponsors) return 'Sponsor Account:';
  return 'Active Account:';
}

/**
 * Row + image sizing to match DataListSelect’s AccountListItem sizing.
 */
const DATALIST_ROW_PY_TW = 'py-2';
const DATALIST_IMG_PX = 38;
const DATALIST_IMG_TW = `h-[${DATALIST_IMG_PX}px] w-[${DATALIST_IMG_PX}px]`;

/**
 * rows 2..4 bigger by ~35%
 */
const COIN_ROW_PY_TW = 'py-[2px]';
const COIN_ROW_TEXT_TW = 'text-[13px] leading-[1.15]';
const COIN_ROW_VALUE_TW = 'text-[13px] leading-[1.15] opacity-80';
const COIN_ROW_BTN_TW = 'scale-[1.0] origin-center';

/**
 * ✅ Prevent row height jumping when Claim becomes visible:
 * - Always render the button
 * - Toggle visibility (visible/invisible)
 * - Reserve enough height for the button
 */
const COIN_ROW_MIN_H_TW = 'min-h-[34px]';

export default function AccountListRewardsPanel({
  walletList,
  setWalletCallBack,
  containerType,
  listType,
}: Props) {
  const ctx = useContext(ExchangeContextState);

  /**
   * ✅ These are the ONLY sources of truth for “mode is active” in THIS module.
   * No fallback logic here: if all three are false, NO claim buttons show.
   */
  const vAgents = usePanelVisible(SP_COIN_DISPLAY.AGENTS);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.RECIPIENTS);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.SPONSORS);

  // Rows that appear
  const showUnSponsorRow = usePanelVisible(SP_COIN_DISPLAY.UNSPONSOR_SP_COINS);
  const showAgentCoinsRow = usePanelVisible(SP_COIN_DISPLAY.CLAIM_PENDING_AGENT_COINS);
  const showRecipientCoinsRow = usePanelVisible(SP_COIN_DISPLAY.CLAIM_PENDING_RECIPIENT_COINS);
  const showSponsorCoinsRow = usePanelVisible(SP_COIN_DISPLAY.CLAIM_PENDING_SPONSOR_COINS);

  // Account type used for Row 1 action + Total action (kept as before)
  const accountType: AccountType = useMemo(() => {
    const derived = vAgents
      ? AccountType.AGENT
      : vRecipients
        ? AccountType.RECIPIENT
        : vSponsors
          ? AccountType.SPONSOR
          : AccountType.SPONSOR;

    debugLog.log?.('[derive accountType (mode-based)]', {
      vAgents,
      vRecipients,
      vSponsors,
      derived,
      derivedLabel: AccountType[derived] ?? String(derived),
      containerType,
      containerLabel: SP_COIN_DISPLAY[containerType],
    });

    return derived;
  }, [vAgents, vRecipients, vSponsors, containerType]);

  const inputAccountText = useMemo(() => {
    const derived = getInputAccountText({ vAgents, vRecipients, vSponsors });
    return derived;
  }, [vAgents, vRecipients, vSponsors]);

  const [showToDo, setShowToDo] = useState<boolean>(false);
  const pendingClaimRef = useRef<PendingClaim | null>(null);

  const [tip, setTip] = useState<{ show: boolean; text: string; x: number; y: number }>({
    show: false,
    text: '',
    x: 0,
    y: 0,
  });

  const { roleLabel, idPrefix } = useMemo(() => {
    const derived = vRecipients
      ? { roleLabel: 'My Recipients', idPrefix: 'mr' }
      : vSponsors
        ? { roleLabel: 'My Sponsors', idPrefix: 'ms' }
        : vAgents
          ? { roleLabel: 'My Agents', idPrefix: 'ma' }
          : { roleLabel: 'Accounts', idPrefix: 'acct' };

    return derived;
  }, [vAgents, vRecipients, vSponsors]);

  const claimRewards = useCallback((type: AccountType, accountId: number, label?: string) => {
    pendingClaimRef.current = { type, accountId, label };
    setShowToDo(true);
  }, []);

  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const pending =
      pendingClaimRef.current ??
      ({
        type: accountType,
        accountId: -1,
        label: undefined,
      } as PendingClaim);

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
    alert(
      [
        'ToDo: (Not Yet Implemented)\n',
        `────────────────────────────────────────────────────────\n`,
        `Unstake and Return Tokens back to Sponsors Trading Pool.\n`,
        `────────────────────────────────────────────────────────\n`,
        pending.label ? `Row: ${pending.label}\n` : '',
        listType === LIST_TYPE.SPONSOR_UNSPONSOR ? `Unsponsor ${label}\n` : `Claim ${label} Rewards\n`,
        isTotal ? `${label} Total\n` : `Target: ${String(rowName)}\n`,
        isTotal ? 'Total Accounts: (aggregate)\n' : `Account: ${String(rowAccount)}\n`,
        `From SPONSOR Account: ${connected ? connected.address : '(not connected)'}\n`,
      ].join(''),
    );
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, walletList, listType]);

  const wrapperId = `${idPrefix}Wrapper`;

  const wrapperTw =
    `${msTableTw.wrapper} !mt-0 mt-0 ` +
    'mt-3 mb-0 max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto';

  const middleHeaderLabel = 'Meta Data';

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

  const onRowEnter = (name?: string | null) =>
    setTip((t) => ({ ...t, show: true, text: name ?? '' }));
  const onRowMove: React.MouseEventHandler = (e) =>
    setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
  const onRowLeave = () => setTip((t) => ({ ...t, show: false }));

  const tableOuterBorderTw = 'border border-white';
  const colDividerTw = 'border-l border-white';
  const rowDividerTw = 'border-b border-white/40';

  /**
   * ✅ Claim button visibility:
   * - AGENT row -> vAgents
   * - RECIPIENT row -> vRecipients
   * - SPONSOR row -> vSponsors
   * - NO fallback (if all false, none show)
   */
  const shouldShowClaimForType = useCallback(
    (type: AccountType) => {
      if (type === AccountType.AGENT) return vAgents;
      if (type === AccountType.RECIPIENT) return vRecipients;
      if (type === AccountType.SPONSOR) return vSponsors;
      return false;
    },
    [vAgents, vRecipients, vSponsors],
  );

  const renderClaimCoinRow = (
    zebraTw: string,
    label: string,
    valueText: string,
    type: AccountType,
    subRowOffset: number,
    walletIndex: number,
  ) => {
    const btnTw =
      (walletIndex + subRowOffset) % 2 === 0 ? msTableTw.btnOrange : msTableTw.btnGreen;

    const showClaimButton = shouldShowClaimForType(type);

    return (
      <tr className={`${zebraTw} ${rowDividerTw} ${COIN_ROW_MIN_H_TW}`}>
        <td
          className={`${zebraTw} px-3 ${COIN_ROW_PY_TW} ${COIN_ROW_TEXT_TW} align-middle w-1 whitespace-nowrap`}
        >
          <div className={`inline-flex items-center justify-start bg-transparent ${COIN_ROW_MIN_H_TW}`}>
            {label}
          </div>
        </td>

        <td
          className={`${zebraTw} px-3 ${COIN_ROW_PY_TW} ${COIN_ROW_VALUE_TW} align-middle ${colDividerTw}`}
        >
          <div className={`w-full flex items-center justify-start bg-transparent ${COIN_ROW_MIN_H_TW}`}>
            {valueText}
          </div>
        </td>

        <td
          className={`${zebraTw} pl-[5px] pr-[8px] ${COIN_ROW_PY_TW} ${COIN_ROW_TEXT_TW} align-middle ${colDividerTw}`}
        >
          <div className={`w-full flex items-center justify-center bg-transparent ${COIN_ROW_MIN_H_TW}`}>
            <button
              type="button"
              className={`${btnTw} ${COIN_ROW_BTN_TW} ${showClaimButton ? 'visible' : 'invisible'}`}
              aria-label={`Claim ${label}`}
              title={`Claim ${label}`}
              onClick={() => {
                if (!showClaimButton) return;
                claimRewards(type, walletIndex, label);
              }}
            >
              Claim
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
      <AddressSelect
        defaultAddress={undefined}
        bypassDefaultFsm
        callingParent={'ManageAccount'}
        useActiveAddr={true}
        shortAddr={true}
        preText={inputAccountText}
      />

      {tip.show && tip.text ? (
        <div
          className="fixed z-[9999] pointer-events-none bg-white text-black px-[10px] py-[6px] rounded-lg text-[12px] leading-[1.2] shadow-lg max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, -120%)' }}
        >
          {tip.text}
        </div>
      ) : null}

      <div id={wrapperId} className={wrapperTw} data-list-type={LIST_TYPE[listType]}>
        <table className={`min-w-full ${msTableTw.table} ${tableOuterBorderTw}`}>
          <thead>
            <tr className={`${msTableTw.theadRow} sticky top-0 z-20 ${rowDividerTw}`}>
              <th
                scope="col"
                className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${msTableTw.colFit} sticky top-0 z-20 bg-[#1f2639]`}
              >
                {roleLabel}
              </th>

              <th
                scope="col"
                className={`${msTableTw.th} ${msTableTw.thPad3} text-left sticky top-0 z-20 bg-[#1f2639] ${colDividerTw}`}
              >
                {middleHeaderLabel}
              </th>

              <th
                scope="col"
                className={`${msTableTw.th5} ${msTableTw.th5Pad3} text-center ${msTableTw.colFit} sticky top-0 z-20 bg-[#1f2639] ${colDividerTw}`}
              >
                {actionHeaderLabel}
              </th>
            </tr>
          </thead>

          <tbody>
            {walletList.map((w, i) => {
              const zebra = i % 2 === 0 ? msTableTw.rowA : msTableTw.rowB;

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
                <React.Fragment key={`${i}-${addressText}`}>
                  {/* Row 1 */}
                  <tr className={`${zebra} ${rowDividerTw}`}>
                    <td className="p-0">
                      <button
                        type="button"
                        className={`${zebra} ${msTableTw.tdInnerCenter5} w-full flex-col hover:opacity-90 focus:outline-none ${DATALIST_ROW_PY_TW}`}
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
                          width={DATALIST_IMG_PX}
                          height={DATALIST_IMG_PX}
                          className={`${DATALIST_IMG_TW} object-contain rounded`}
                        />
                      </button>
                    </td>

                    <td className={`${zebra} px-3 text-sm align-middle ${colDividerTw}`}>
                      <div className="min-w-0 flex flex-col items-start justify-center">
                        <div className="font-semibold truncate !text-[#5981F3]">{w?.name ?? 'Unknown'}</div>
                        <div className="text-sm truncate !text-[#5981F3]">{w?.symbol ?? ''}</div>
                      </div>
                    </td>

                    {/* ✅ CHANGE: third column has NO button now */}
                    <td className={`${zebra} pl-[5px] pr-[8px] text-sm align-middle ${colDividerTw}`}>
                      <div className="w-full flex items-center justify-center bg-transparent" />
                    </td>
                  </tr>

                  {/* Rows 2..5 */}
                  {showUnSponsorRow
                    ? renderClaimCoinRow(zebra, 'Staked Coins', '0.0', AccountType.SPONSOR, 99, i)
                    : null}
                  {showSponsorCoinsRow
                    ? renderClaimCoinRow(zebra, 'Sponsor Coins', '0.0', AccountType.SPONSOR, 0, i)
                    : null}
                  {showRecipientCoinsRow
                    ? renderClaimCoinRow(
                        zebra,
                        'Recipient Coins',
                        '0.0',
                        AccountType.RECIPIENT,
                        1,
                        i,
                      )
                    : null}
                  {showAgentCoinsRow
                    ? renderClaimCoinRow(zebra, 'Agent Coins', '0.0', AccountType.AGENT, 2, i)
                    : null}
                </React.Fragment>
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

                  <td className={`${zebra} px-3 text-sm align-middle ${colDividerTw}`}>
                    <div className="w-full flex items-center justify-center bg-transparent">0</div>
                  </td>

                  <td className={`${zebra} pl-[5px] pr-[8px] text-sm align-middle ${colDividerTw}`}>
                    <div className="w-full flex items-center justify-center bg-transparent">
                      <button
                        type="button"
                        className={actionTw}
                        aria-label={`${actionButtonLabel} total`}
                        onClick={() => claimRewards(accountType, -1, `${actionButtonLabel} (TOTAL)`)}
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
