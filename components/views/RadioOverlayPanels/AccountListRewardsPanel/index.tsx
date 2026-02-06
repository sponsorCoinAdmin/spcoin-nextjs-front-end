// File: @/components/views/RadioOverlayPanels/AccountListRewardsPanel/index.tsx
'use client';

import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { AccountType, SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { suppressNextOverlayClose } from '@/lib/context/exchangeContext/hooks/useOverlayCloseHandler';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';
import AddressSelect from '../../AssetSelectPanels/AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { msTableTw } from '../msTableTw';

import AccountCell from './AccountCell';
import RewardsSubTable from './RewardsSubTable';
import TotalRow from './TotalRow';

import type { PendingClaim, SubRowOpenState } from './types';

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

export type Props = {
  accountList: spCoinAccount[];
  setAccountCallBack: (account?: spCoinAccount) => void;
  containerType: SP_COIN_DISPLAY;
};

function isPendingPanel(p: SP_COIN_DISPLAY) {
  return (
    p === SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS ||
    p === SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS ||
    p === SP_COIN_DISPLAY.PENDING_AGENT_REWARDS
  );
}

type RoleKind = 'sponsor' | 'recipient' | 'agent' | 'unknown';

function roleLabelToRoleKind(roleLabel: string): RoleKind {
  const s = (roleLabel ?? '').toString().trim().toLowerCase();
  if (s === 'recipient') return 'recipient';
  if (s === 'agent') return 'agent';
  if (s === 'sponsor') return 'sponsor';
  return 'unknown';
}

function roleKindToAccountPanelMode(role: RoleKind): SP_COIN_DISPLAY | null {
  if (role === 'recipient') return SP_COIN_DISPLAY.ACTIVE_RECIPIENT;
  if (role === 'agent') return SP_COIN_DISPLAY.ACTIVE_AGENT;
  if (role === 'sponsor') return SP_COIN_DISPLAY.ACTIVE_SPONSOR;
  return null;
}

export default function AccountListRewardsPanel({
  accountList,
  setAccountCallBack,
  containerType,
}: Props) {
  const ctx = useContext(ExchangeContextState);

  // ✅ panel navigation (openPanel)
  const panelTree = usePanelTree();
  const openPanel = (panelTree as any)?.openPanel as
    | ((p: SP_COIN_DISPLAY, invoker?: string, parent?: SP_COIN_DISPLAY) => void)
    | undefined;

  // ✅ Pending-mode flags (SSOT for mode)
  const cfgClaimAgent = usePanelVisible(SP_COIN_DISPLAY.PENDING_AGENT_REWARDS);
  const cfgClaimRecipient = usePanelVisible(SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS);
  const cfgClaimSponsor = usePanelVisible(SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS);

  // ✅ Unsponsor / Staked mode (SSOT for mode)
  const showUnSponsorRow = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS);

  // ✅ Global chevron state (UI-only)
  const cfgChevronOpen: boolean = usePanelVisible(SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING);

  const { effectiveChevronOpenPending, setGlobalChevronOpen } = useChevronOpenPending(
    cfgChevronOpen,
    ctx,
    SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING,
  );

  const [openByWalletKey, setOpenByWalletKey] = useState<Record<string, SubRowOpenState>>({});

  /**
   * ✅ Derive list type internally (no prop required).
   * Priority: UNSPONSOR > pending sponsor > pending recipient > pending agent > default.
   */
  const listType: SP_COIN_DISPLAY = useMemo(() => {
    if (showUnSponsorRow) return SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS;
    if (cfgClaimSponsor) return SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS;
    if (cfgClaimRecipient) return SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS;
    if (cfgClaimAgent) return SP_COIN_DISPLAY.PENDING_AGENT_REWARDS;
    return SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL;
  }, [showUnSponsorRow, cfgClaimSponsor, cfgClaimRecipient, cfgClaimAgent]);

  /**
   * ✅ Derive “mode” booleans WITHOUT SPONSORS/RECIPIENTS/AGENTS panels.
   * We synthesize vAgents/vRecipients/vSponsors purely for the UI helpers.
   */
  const { vAgents, vRecipients, vSponsors } = useMemo(() => {
    if (cfgClaimAgent) return { vAgents: true, vRecipients: false, vSponsors: false };
    if (cfgClaimRecipient) return { vAgents: false, vRecipients: true, vSponsors: false };

    // Sponsor mode includes:
    // - Pending Sponsor Rewards
    // - Unsponsor flow (still “Sponsor-side” accounts)
    if (cfgClaimSponsor || showUnSponsorRow)
      return { vAgents: false, vRecipients: false, vSponsors: true };

    // Fallback default
    return { vAgents: false, vRecipients: false, vSponsors: true };
  }, [cfgClaimAgent, cfgClaimRecipient, cfgClaimSponsor, showUnSponsorRow]);

  const accountType = useMemo((): AccountType => {
    const derived = vAgents ? AccountType.AGENT : vRecipients ? AccountType.RECIPIENT : AccountType.SPONSOR;

    debugLog.log?.('[derive accountType (pending-mode)]', {
      cfgClaimSponsor,
      cfgClaimRecipient,
      cfgClaimAgent,
      showUnSponsorRow,
      derived,
      derivedLabel: AccountType[derived] ?? String(derived),
      containerType,
      listType,
      listTypeLabel: SP_COIN_DISPLAY[listType],
    });

    return derived;
  }, [
    vAgents,
    vRecipients,
    cfgClaimSponsor,
    cfgClaimRecipient,
    cfgClaimAgent,
    showUnSponsorRow,
    containerType,
    listType,
  ]);

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

    // UNSPONSOR (staked) or default view
    return { accountRole1: 'Accounts', accountRole2: 'Accounts' };
  }, [cfgClaimSponsor, cfgClaimRecipient, cfgClaimAgent]);

  const showRewardsRow = cfgClaimSponsor || cfgClaimRecipient || cfgClaimAgent;

  // ✅ idPrefix no longer depends on SPONSORS/RECIPIENTS/AGENTS visibility panels
  const idPrefix = useMemo(() => {
    if (cfgClaimRecipient) return 'mr';
    if (cfgClaimAgent) return 'ma';
    // sponsor pending OR unsponsor OR fallback
    return 'ms';
  }, [cfgClaimRecipient, cfgClaimAgent]);

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
      listTypeLabel: SP_COIN_DISPLAY[listType],
      pending,
      isTotal,
      rowName,
      sponsorConnected: connected ? connected.address : '(not connected)',
    });
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, accountList, listType]);

  const actionButtonLabel =
    listType === SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS
      ? 'Unsponsor'
      : isPendingPanel(listType)
        ? 'Claim'
        : 'Action';

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

  /**
   * ✅ NEW: ensure ExchangeContext role account is set BEFORE opening ACTIVE_* + ACCOUNT_PANEL
   *
   * Writes into BOTH shapes supported in your app:
   * - ctx.exchangeContext.accounts.<role>Account   (nested)
   * - ctx.accounts.<role>Account                  (root legacy)
   */
  const setRoleAccountInContext = useCallback(
    (role: RoleKind, picked?: spCoinAccount) => {
      if (!picked) return;

      const setter = (ctx as any)?.setExchangeContext as
        | ((updater: any, hookName?: string) => void)
        | undefined;

      if (typeof setter !== 'function') return;

      const key =
        role === 'sponsor' ? 'sponsorAccount' : role === 'recipient' ? 'recipientAccount' : role === 'agent' ? 'agentAccount' : null;

      if (!key) return;

      setter(
        (prev: any) => {
          const prevEx = prev?.exchangeContext ?? prev;
          const prevAccounts = prevEx?.accounts ?? {};

          const alreadySame =
            String(prevAccounts?.[key]?.address ?? '') === String((picked as any)?.address ?? '');

          // Keep object identity stable if no actual change
          if (alreadySame) return prev;

          const writeAccounts = {
            ...prevAccounts,
            [key]: picked,
          };

          // Preserve both possible shapes
          if (prev?.exchangeContext) {
            return {
              ...prev,
              exchangeContext: {
                ...prev.exchangeContext,
                accounts: writeAccounts,
              },
              // optional mirror
              accounts: {
                ...(prev?.accounts ?? {}),
                [key]: picked,
              },
            };
          }

          return {
            ...prev,
            accounts: {
              ...(prev?.accounts ?? {}),
              ...writeAccounts,
            },
          };
        },
        `AccountListRewardsPanel:setRoleAccount:${role}`,
      );
    },
    [ctx],
  );

  /**
   * ✅ NEW: when a logo is picked in either column:
   * 1) setExchangeContext accounts.<role>Account = picked
   * 2) call existing setAccountCallBack(picked)
   * 3) open ACTIVE_* matching that column’s role label
   * 4) open ACCOUNT_PANEL
   */
  const handlePickForRole = useCallback(
    (roleLabel: string, picked?: spCoinAccount) => {
      const role = roleLabelToRoleKind(roleLabel);

      // 1) set role account in ExchangeContext first
      setRoleAccountInContext(role, picked);

      // 2) preserve current behavior (parent selection callback)
      try {
        setAccountCallBack?.(picked);
      } catch {}

      // 3/4) open correct panels
      const modeToOpen = roleKindToAccountPanelMode(role);
      if (!modeToOpen) return;
      if (typeof openPanel !== 'function') return;

      suppressNextOverlayClose('AccountListRewardsPanel:pick->AccountPanel', 'AccountListRewardsPanel');

      openPanel(modeToOpen, `AccountListRewardsPanel:pick:${roleLabel}`);
      openPanel(SP_COIN_DISPLAY.ACCOUNT_PANEL, `AccountListRewardsPanel:openAccountPanel`);
    },
    [setRoleAccountInContext, setAccountCallBack, openPanel],
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
                    className={`m-0 p-0 rounded-md ${
                      effectiveChevronOpenPending ? GLOBAL_CHEVRON_UP_BG : GLOBAL_CHEVRON_DOWN_BG
                    } flex items-center justify-center`}
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
            {accountList.map((w: spCoinAccount, i: number) => {
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
              const rw = accountList[revIndex] as spCoinAccount;
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
                        onPick={(picked?: spCoinAccount) => handlePickForRole(accountRole1, picked)}
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
                        onPick={(picked?: spCoinAccount) => handlePickForRole(accountRole2, picked)}
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
