// Dir: @/components/views/RadioOverlayPanels/AccountListRewardsPanel
'use client';

import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { AccountType, SP_COIN_DISPLAY } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';
import AddressSelect from '../../AssetSelectPanels/AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { msTableTw } from '../msTableTw';

import AccountCell from './AccountCell';
import RewardsSubTable from './RewardsSubTable';
import TotalRow from './TotalRow';
import type { PendingClaim, Props, SubRowOpenState } from './types';
import {
  CELL_LEFT_OUTLINE_TW,
  CELL_RIGHT_OUTLINE_TW,
  CELL_VDIV_TW,
  CHEVRON_FG_TW,
  CHEVRON_ICON_TW,
  DATALIST_ROW_PY_TW,
  EMPTY_SUBROWS,
  GLOBAL_CHEVRON_DOWN_BG,
  GLOBAL_CHEVRON_UP_BG,
  ROW_OUTLINE_TW,
} from './constants';
import { getAddressText, getInputAccountText, shortAddr } from './utils';
import { useChevronOpenPending } from './useChevronOpenPending';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

export default function AccountListRewardsPanel({ accountList, setAccountCallBack, containerType, listType }: Props) {
  const ctx = useContext(ExchangeContextState);

  const vAgents = usePanelVisible(SP_COIN_DISPLAY.AGENTS);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.RECIPIENTS);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.SPONSORS);

  const cfgClaimAgent = usePanelVisible(SP_COIN_DISPLAY.PENDING_AGENT_COINS);
  const cfgClaimRecipient = usePanelVisible(SP_COIN_DISPLAY.PENDING_RECIPIENT_COINS);
  const cfgClaimSponsor = usePanelVisible(SP_COIN_DISPLAY.PENDING_SPONSOR_COINS);

  const showUnSponsorRow = usePanelVisible(SP_COIN_DISPLAY.UNSPONSOR_SP_COINS);
  const cfgChevronOpen: boolean = usePanelVisible(SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING);

  const { effectiveChevronOpenPending, setGlobalChevronOpen } = useChevronOpenPending(
    cfgChevronOpen,
    ctx,
    SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING,
  );

  const [openByWalletKey, setOpenByWalletKey] = useState<Record<string, SubRowOpenState>>({});

  const accountType = useMemo((): AccountType => {
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
    });

    return derived;
  }, [vAgents, vRecipients, vSponsors, containerType]);

  const inputAccountText = useMemo(
    () => getInputAccountText({ vAgents, vRecipients, vSponsors }),
    [vAgents, vRecipients, vSponsors],
  );

  const [showToDo, setShowToDo] = useState(false);
  const pendingClaimRef = useRef<PendingClaim | null>(null);

  const [tip, setTip] = useState<{ show: boolean; text: string; x: number; y: number }>({
    show: false,
    text: '',
    x: 0,
    y: 0,
  });

  const { accountRole1, accountRole2 } = useMemo(() => {
    if (cfgClaimSponsor) return { accountRole1: 'Recipient', accountRole2: 'Agent' };
    if (cfgClaimRecipient) return { accountRole1: 'Sponsor', accountRole2: 'Agent' };
    if (cfgClaimAgent) return { accountRole1: 'Recipient', accountRole2: 'Sponsor' };
    return { accountRole1: 'Accounts', accountRole2: 'Accounts' };
  }, [cfgClaimSponsor, cfgClaimRecipient, cfgClaimAgent]);

  const showRewardsRow = cfgClaimSponsor || cfgClaimRecipient || cfgClaimAgent;
  const idPrefix = useMemo(() => (vRecipients ? 'mr' : vSponsors ? 'ms' : vAgents ? 'ma' : 'acct'), [vAgents, vRecipients, vSponsors]);

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

    const isTotal = pending.accountId < 0 || pending.accountId >= accountList.length;
    const row = isTotal ? undefined : accountList[pending.accountId];

    const addressText = row ? getAddressText(row as any) : 'N/A';
    const rowName = (row as any)?.name ?? (addressText ? shortAddr(addressText) : 'N/A');

    debugLog.log?.('[ToDo]', {
      listType,
      pending,
      isTotal,
      rowName,
      sponsorConnected: connected ? connected.address : '(not connected)',
    });
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, accountList, listType]);

  const actionButtonLabel =
    listType === SP_COIN_DISPLAY.UNSPONSOR_SP_COINS ? 'Unsponsor' : listType === SP_COIN_DISPLAY.SPONSORS ? 'Claim' : 'Action';
  const actionButtonText = actionButtonLabel === 'Claim' ? 'Claim All' : actionButtonLabel;

  const onRowEnter = (name?: string | null) => setTip((t) => ({ ...t, show: true, text: name ?? '' }));
  const onRowMove: React.MouseEventHandler = (e) => setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
  const onRowLeave = () => setTip((t) => ({ ...t, show: false }));

  const isSponsorMode = showUnSponsorRow || cfgClaimSponsor;

  const setWalletRows3to5Open = useCallback((walletKey: string, open: boolean) => {
    setOpenByWalletKey((prev) => {
      const cur = prev[walletKey] ?? (EMPTY_SUBROWS as SubRowOpenState);
      const nextForKey: SubRowOpenState = { ...cur, sponsor: open, recipient: open, agent: open, staked: open };
      return { ...prev, [walletKey]: nextForKey };
    });
  }, []);

  const getClaimRowFgTw = useCallback(
    (label: string) => {
      const DEFAULT = 'text-white';
      const LIGHT_GREEN = 'text-green-300';
      if (cfgClaimSponsor && (label === 'Sponsor' || label === 'Staked')) return LIGHT_GREEN;
      if (!cfgClaimSponsor && cfgClaimAgent && label === 'Agent') return LIGHT_GREEN;
      if (!cfgClaimSponsor && !cfgClaimAgent && cfgClaimRecipient && label === 'Recipient') return LIGHT_GREEN;
      return DEFAULT;
    },
    [cfgClaimSponsor, cfgClaimAgent, cfgClaimRecipient],
  );

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

      <div
        id={`${idPrefix}Wrapper`}
        className={`${msTableTw.wrapper} !mt-0 mt-0 mt-3 mb-0 max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto`}
        data-list-type={SP_COIN_DISPLAY[listType]}
      >
        <table id="ACCOUNT_LIST_REWARDS_TABLE" className={`min-w-full ${msTableTw.table}`}>
          <thead>
            <tr className={`${msTableTw.theadRow} sticky top-0 z-20`}>
              <th
                style={{ width: '50%' }}
                scope="col"
                className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${CELL_LEFT_OUTLINE_TW} ${CELL_VDIV_TW} ${ROW_OUTLINE_TW}`}
              >
                <div className="w-full flex items-center gap-2">
                  <button
                    type="button"
                    className={`m-0 p-0 rounded-md ${effectiveChevronOpenPending ? GLOBAL_CHEVRON_UP_BG : GLOBAL_CHEVRON_DOWN_BG} flex items-center justify-center`}
                    aria-label={
                      effectiveChevronOpenPending
                        ? 'Chevron Up (Close all wallet rows)'
                        : 'Chevron Down (Open all Sponsorship Account Rows)'
                    }
                    title={effectiveChevronOpenPending ? 'Close all wallet rows' : 'Open all account rows'}
                    onClick={() => setGlobalChevronOpen(!effectiveChevronOpenPending)}
                  >
                    {effectiveChevronOpenPending ? (
                      <ChevronUp className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                    ) : (
                      <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                    )}
                  </button>

                  <span className="truncate">{accountRole1}</span>
                </div>
              </th>

              <th
                style={{ width: '50%' }}
                scope="col"
                className={`${msTableTw.th} ${msTableTw.thPad3} text-left ${CELL_RIGHT_OUTLINE_TW} ${ROW_OUTLINE_TW}`}
              >
                {accountRole2}
              </th>
            </tr>
          </thead>

          <tbody>
            {accountList.map((w, i) => {
              const zebra = i % 2 === 0 ? msTableTw.rowA : msTableTw.rowB;

              const addressText = getAddressText(w as any);
              const walletKey = String((w as any)?.id ?? addressText ?? i);
              const stableKey = (w as any)?.id ?? `${i}-${addressText}`;

              const st = openByWalletKey[walletKey] ?? (EMPTY_SUBROWS as SubRowOpenState);
              const walletOpenRows3to5 = !!st.sponsor && !!st.recipient && !!st.agent;
              const effectiveWalletOpenRows3to5 = cfgChevronOpen || walletOpenRows3to5;

              const rewardsOpen = effectiveWalletOpenRows3to5;
              const tokenRowVisible = effectiveWalletOpenRows3to5;

              const showRow3 = effectiveWalletOpenRows3to5;
              const showRow4 = effectiveWalletOpenRows3to5;
              const showRow5 = effectiveWalletOpenRows3to5;

              const revIndex = accountList.length - 1 - i;
              const rw = accountList[revIndex];
              const rwAddressText = getAddressText(rw as any);

              return (
                <React.Fragment key={stableKey}>
                  <tr className={ROW_OUTLINE_TW}>
                    <td
                      style={{ width: '50%' }}
                      className={`${zebra} ${msTableTw.td5} px-0 ${DATALIST_ROW_PY_TW} align-middle ${CELL_LEFT_OUTLINE_TW} ${CELL_VDIV_TW}`}
                    >
                      <AccountCell
                        account={w}
                        roleLabel={accountRole1}
                        addressText={addressText}
                        onPick={setAccountCallBack}
                        onRowEnter={onRowEnter}
                        onRowMove={onRowMove}
                        onRowLeave={onRowLeave}
                      />
                    </td>

                    <td
                      style={{ width: '50%' }}
                      className={`${zebra} ${msTableTw.td5} px-0 ${DATALIST_ROW_PY_TW} align-middle ${CELL_RIGHT_OUTLINE_TW}`}
                    >
                      <AccountCell
                        account={rw}
                        roleLabel={accountRole2}
                        addressText={rwAddressText}
                        onPick={setAccountCallBack}
                        onRowEnter={onRowEnter}
                        onRowMove={onRowMove}
                        onRowLeave={onRowLeave}
                      />
                    </td>
                  </tr>

                  <RewardsSubTable
                    zebra={zebra}
                    walletKey={walletKey}
                    walletIndex={i}
                    tokenRowVisible={tokenRowVisible}
                    showRow3={showRow3}
                    showRow4={showRow4}
                    showRow5={showRow5}
                    rewardsOpen={rewardsOpen}
                    showRewardsRow={showRewardsRow}
                    showUnSponsorRow={showUnSponsorRow}
                    isSponsorMode={isSponsorMode}
                    onSetWalletRows3to5Open={setWalletRows3to5Open}
                    onClaim={claimRewards}
                    getClaimRowFgTw={getClaimRowFgTw}
                  />
                </React.Fragment>
              );
            })}

            <TotalRow
              zebra={accountList.length % 2 === 0 ? msTableTw.rowA : msTableTw.rowB}
              actionButtonText={actionButtonText}
              accountType={accountType}
              onClaim={claimRewards}
            />
          </tbody>
        </table>
      </div>

      {showToDo && <ToDo show message="ToDo" opacity={0.5} color="#ff1a1a" zIndex={2000} onDismiss={doToDo} />}
    </>
  );
}
