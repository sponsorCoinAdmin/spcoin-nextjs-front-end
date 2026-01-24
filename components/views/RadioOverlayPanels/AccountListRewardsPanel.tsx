// File: @/components/views/RadioOverlayPanels/AccountListRewardsPanel.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext, useRef, useEffect } from 'react';
import Image from 'next/image';

import type { WalletAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType, LIST_TYPE } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import AddressSelect from '../AssetSelectPanels/AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
function getInputAccountText(opts: { vAgents: boolean; vRecipients: boolean; vSponsors: boolean }): string {
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
const DATALIST_IMG_TW = 'h-[38px] w-[38px]';

/**
 * rows 2..4 bigger by ~35%
 */
const COIN_ROW_PY_TW = 'py-[2px]';
const COIN_ROW_TEXT_TW = 'text-[13px] leading-[1.15]';
const COIN_ROW_VALUE_TW = 'text-[13px] leading-[1.15] opacity-80';
const COIN_ROW_BTN_TW = 'scale-[1.0] origin-center';

const COIN_ROW_MIN_H_TW = 'min-h-[34px]';

/**
 * ✅ Claim/Unstake buttons: 5px left/right internal padding.
 */
const BTN_XPAD_HALF_TW = '!px-[5px]';

/**
 * ✅ Chevron styling (50% larger)
 */
const CHEVRON_ICON_TW = 'w-[21px] h-[21px]';
const CHEVRON_FG_TW = 'text-white';

/**
 * ✅ Global chevron colors
 */
const GLOBAL_CHEVRON_DOWN_BG = 'bg-blue-600';
const GLOBAL_CHEVRON_UP_BG = 'bg-red-600';

/**
 * ✅ Per-row chevron colors
 */
const ROW_CHEVRON_BG_OPEN = 'bg-orange-500';
const ROW_CHEVRON_BG_CLOSED = 'bg-green-500';

/**
 * ✅ LocalStorage key for chevron state (direct persist for immediate "flash")
 */
const LS_CHEVRON_OPEN_KEY = 'spcoin:chevron_down_open_pending';

/**
 * ✅ Per-wallet row open state
 */
type SubRowKey = 'staked' | 'sponsor' | 'recipient' | 'agent';
type SubRowOpenState = Partial<Record<SubRowKey, boolean>> & { all?: boolean };
type OpenByWalletKey = Record<string, SubRowOpenState>;

const EMPTY_SUBROWS: SubRowOpenState = Object.freeze({});

/**
 * ✅ EXACT aria-labels requested for Claim/Unstake buttons
 */
function getActionButtonAriaLabel(buttonText: string, label: string) {
  // Claim rows
  if (buttonText === 'Claim' && label === 'Sponsor') return 'Claim Sponsor SpCoin Rewards';
  if (buttonText === 'Claim' && label === 'Recipient') return 'Claim Recipient SpCoin Rewards';
  if (buttonText === 'Claim' && label === 'Agent') return 'Claim Agent SpCoin Rewards';

  // Unstake row
  if (buttonText === 'Unstake' && label === 'Staked') return 'Unstake SpCoins';

  // Fallback
  return `${buttonText} ${label}`;
}

/**
 * ✅ Option A tooltip text for rows 2..5 (native browser tooltip via title=... on the label cell)
 */
function getRowLabelTitle(label: string) {
  if (label === 'Staked') return 'Staked SpCoin Quantity';
  if (label === 'Sponsor') return 'Pending Sponsor SpCoin Rewards';
  if (label === 'Recipient') return 'Pending Recipient SpCoin Rewards';
  if (label === 'Agent') return 'Pending Agent SpCoin Rewards';
  return '';
}

/**
 * Best-effort:
 * - Update panelStore (so usePanelVisible changes)
 * - Update ExchangeContext (so persistWithOptDiff runs / LS snapshot changes)
 */
function setPanelVisibleEverywhere(ctx: any, panel: SP_COIN_DISPLAY, visible: boolean) {
  // 1) panelStore (authoritative for usePanelVisible)
  try {
    const ps: any = panelStore as any;
    if (typeof ps?.setPanelVisible === 'function') ps.setPanelVisible(panel, visible);
    else if (typeof ps?.setVisible === 'function') ps.setVisible(panel, visible);
    else if (typeof ps?.set === 'function') ps.set(panel, visible);
    else if (typeof ps?.dispatch === 'function') {
      ps.dispatch({ type: 'SET_PANEL_VISIBLE', payload: { panel, visible } });
    }
  } catch {
    // no-op
  }

  // 2) ExchangeContext (to trigger persistWithOptDiff)
  try {
    if (typeof ctx?.setExchangeContext === 'function') {
      ctx.setExchangeContext(
        (prev: any) => {
          const prevSettings = prev?.settings ?? {};
          const prevTree = Array.isArray(prevSettings.spCoinPanelTree) ? prevSettings.spCoinPanelTree : [];

          const nextTree = prevTree.map((node: any) => ({ ...node }));

          let found = false;
          for (const node of nextTree) {
            const id = Number(node?.id ?? node?.panel ?? node?.displayTypeId);
            if (!Number.isFinite(id)) continue;
            if (id === Number(panel)) {
              node.visible = !!visible;
              if (node.id !== undefined) node.id = id;
              if (node.panel !== undefined) node.panel = id;
              found = true;
              break;
            }
          }

          if (!found) {
            nextTree.push({
              id: Number(panel),
              panel: Number(panel),
              visible: !!visible,
              name: SP_COIN_DISPLAY[panel] ?? String(panel),
            });
          }

          return {
            ...prev,
            settings: {
              ...prevSettings,
              spCoinPanelTree: nextTree,
            },
          };
        },
        'AccountListRewardsPanel:chevronToggle',
      );
    }
  } catch {
    // no-op
  }
}

export default function AccountListRewardsPanel({ walletList, setWalletCallBack, containerType, listType }: Props) {
  const ctx = useContext(ExchangeContextState);

  const vAgents = usePanelVisible(SP_COIN_DISPLAY.AGENTS);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.RECIPIENTS);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.SPONSORS);

  const cfgClaimAgent = usePanelVisible(SP_COIN_DISPLAY.PENDING_AGENT_COINS);
  const cfgClaimRecipient = usePanelVisible(SP_COIN_DISPLAY.PENDING_RECIPIENT_COINS);
  const cfgClaimSponsor = usePanelVisible(SP_COIN_DISPLAY.PENDING_SPONSOR_COINS);

  const showUnSponsorRow = usePanelVisible(SP_COIN_DISPLAY.UNSPONSOR_SP_COINS);

  // ✅ Global open-all flag
  const cfgChevronOpen: boolean = usePanelVisible(SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING);

  const [chevronOpenPending, setChevronOpenPending] = useState<boolean>(false);
  const [openByWalletKey, setOpenByWalletKey] = useState<OpenByWalletKey>({});

  // ✅ boolean hook/state
  const [isOnlyStaked, setIsOnlyStaked] = useState<boolean>(false);

  const didHydrateChevronRef = useRef(false);

  useEffect(() => {
    setChevronOpenPending(cfgChevronOpen);

    if (didHydrateChevronRef.current) return;
    didHydrateChevronRef.current = true;

    if (typeof window === 'undefined') return;

    const lsOpen = window.localStorage.getItem(LS_CHEVRON_OPEN_KEY);
    const hasLs = lsOpen === 'true' || lsOpen === 'false';
    if (!hasLs) return;

    const resolvedOpen = lsOpen === 'true';

    setChevronOpenPending(resolvedOpen);
    setPanelVisibleEverywhere(ctx, SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING, resolvedOpen);
  }, [cfgChevronOpen, ctx]);

  // ✅ monitor all 4 fields (UNSPONSOR + 3 claim flags)
  useEffect(() => {
    setIsOnlyStaked(showUnSponsorRow && !cfgClaimSponsor && !cfgClaimRecipient && !cfgClaimAgent);
  }, [showUnSponsorRow, cfgClaimSponsor, cfgClaimRecipient, cfgClaimAgent]);

  const effectiveChevronOpenPending = cfgChevronOpen || chevronOpenPending;

  // ✅ Header chevrons: Down => true, Up => false
  const setGlobalChevronOpen = useCallback(
    (open: boolean) => {
      debugLog.log?.('[global chevron]', { open });

      setChevronOpenPending(open);

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LS_CHEVRON_OPEN_KEY, String(open));
        }
      } catch {
        // no-op
      }

      setPanelVisibleEverywhere(ctx, SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING, open);
    },
    [ctx],
  );

  const accountType: AccountType = useMemo(() => {
    const derived = vAgents ? AccountType.AGENT : vRecipients ? AccountType.RECIPIENT : vSponsors ? AccountType.SPONSOR : AccountType.SPONSOR;

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

  const inputAccountText = useMemo(() => getInputAccountText({ vAgents, vRecipients, vSponsors }), [vAgents, vRecipients, vSponsors]);

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
      ? { roleLabel: 'Recipients', idPrefix: 'mr' }
      : vSponsors
        ? { roleLabel: 'Sponsors', idPrefix: 'ms' }
        : vAgents
          ? { roleLabel: 'Agents', idPrefix: 'ma' }
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

    const label = pending.type === AccountType.ALL ? 'ALL' : `${pending.type.toString()}${isTotal ? '(s)' : ''}`;

    debugLog.log?.('[ToDo]', {
      listType,
      pending,
      label,
      isTotal,
      rowName,
      rowAccount,
      sponsorConnected: connected ? connected.address : '(not connected)',
    });
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, walletList, listType]);

  const wrapperId = `${idPrefix}Wrapper`;

  const wrapperTw = `${msTableTw.wrapper} !mt-0 mt-0 ` + 'mt-3 mb-0 max-h-[45vh] md:max-h-[59vh] overflow-x-auto overflow-y-auto';

  const middleHeaderLabel = 'Meta Data';

  const actionHeaderLabel = listType === LIST_TYPE.SPONSOR_UNSPONSOR ? 'Unsponsor' : listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS ? 'Rewards' : 'Action';

  const actionButtonLabel = listType === LIST_TYPE.SPONSOR_UNSPONSOR ? 'Unsponsor' : listType === LIST_TYPE.SPONSOR_CLAIM_REWARDS ? 'Claim' : 'Action';

  const onRowEnter = (name?: string | null) => setTip((t) => ({ ...t, show: true, text: name ?? '' }));
  const onRowMove: React.MouseEventHandler = (e) => setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
  const onRowLeave = () => setTip((t) => ({ ...t, show: false }));

  // ✅ remove table borders/dividers
  const tableOuterBorderTw = '';
  const rowDividerTw = '';

  // ✅ Sponsor-mode helper (UNSPONSOR or PENDING_SPONSOR)
  const isSponsorMode = showUnSponsorRow || cfgClaimSponsor;

  const shouldShowClaimForType = useCallback(
    (type: AccountType) => {
      if (type === AccountType.AGENT) return cfgClaimAgent;
      if (type === AccountType.RECIPIENT) return cfgClaimRecipient;
      if (type === AccountType.SPONSOR) return cfgClaimSponsor || showUnSponsorRow;
      return false;
    },
    [cfgClaimAgent, cfgClaimRecipient, cfgClaimSponsor, showUnSponsorRow],
  );

  const setWalletRow2Open = useCallback((walletKey: string, open: boolean) => {
    setOpenByWalletKey((prev) => {
      const cur = prev[walletKey] ?? EMPTY_SUBROWS;
      const nextForKey: SubRowOpenState = { ...cur, staked: open };
      return { ...prev, [walletKey]: nextForKey };
    });
  }, []);

  const setWalletRows3to5Open = useCallback((walletKey: string, open: boolean) => {
    setOpenByWalletKey((prev) => {
      const cur = prev[walletKey] ?? EMPTY_SUBROWS;
      const nextForKey: SubRowOpenState = {
        ...cur,
        sponsor: open,
        recipient: open,
        agent: open,
      };
      return { ...prev, [walletKey]: nextForKey };
    });
  }, []);

  const renderClaimCoinRow = (zebraTw: string, label: string, valueText: string, type: AccountType, subRowOffset: number, walletIndex: number) => {
    const btnTw = (walletIndex + subRowOffset) % 2 === 0 ? msTableTw.btnOrange : msTableTw.btnGreen;

    const isUnstakeRow = label === 'Staked';
    const buttonText = isUnstakeRow ? 'Unstake' : 'Claim';

    const showButton = isUnstakeRow ? isSponsorMode : shouldShowClaimForType(type);

    const actionText = getActionButtonAriaLabel(buttonText, label);
    const labelTitle = getRowLabelTitle(label);

    return (
      <tr className={msTableTw.rowBorder}>
        <td colSpan={2} className={`${zebraTw} ${msTableTw.td5}`} title={labelTitle}>
          <div className={`${msTableTw.tdInner5} ${COIN_ROW_TEXT_TW} ${COIN_ROW_PY_TW} ${COIN_ROW_MIN_H_TW} whitespace-nowrap`}>{label}</div>
        </td>

        <td className={`${zebraTw} ${msTableTw.td}`}>
          <div className={`${msTableTw.tdInner} ${COIN_ROW_VALUE_TW} ${COIN_ROW_PY_TW} ${COIN_ROW_MIN_H_TW} text-left flex justify-start`}>{valueText}</div>
        </td>

        <td className={`${zebraTw} ${msTableTw.td5}`}>
          <div className={`${msTableTw.tdInnerCenter5} ${COIN_ROW_MIN_H_TW}`}>
            <button
              type="button"
              className={`${btnTw} ${COIN_ROW_BTN_TW} ${showButton ? 'visible' : 'invisible'} !min-w-0 !w-auto ${BTN_XPAD_HALF_TW} inline-flex`}
              aria-label={actionText}
              title={actionText}
              onClick={() => {
                if (!showButton) return;
                claimRewards(type, walletIndex, label);
              }}
            >
              {buttonText}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  /**
   * ✅ FIX REQUESTED:
   * - DownChevron = GREEN
   * - UpChevron = ORANGE
   * - NOT stretched (no absolute inset-0)
   */
  const renderRewardsSummaryRow = (zebraTw: string, walletKey: string, walletIndex: number, effectiveWalletOpenRows3to5: boolean) => {
    const claimBtnTw = walletIndex % 2 === 0 ? msTableTw.btnOrange : msTableTw.btnGreen;

    // ✅ exact mapping requested (NOT alternating by row index)
    const rewardsChevronBg = effectiveWalletOpenRows3to5 ? ROW_CHEVRON_BG_OPEN : ROW_CHEVRON_BG_CLOSED;

    const actionText = 'Claim SpCoin Rewards';
    const labelTitle = 'Pending SpCoin Rewards';

    return (
      <tr className={msTableTw.rowBorder}>
        <td className={`${zebraTw} ${msTableTw.td5} !p-0 align-middle w-[17px] min-w-[17px]`}>
          <div className="w-full h-full flex items-center justify-center">
            <button
              type="button"
              className={`m-0 p-0 rounded-md ${rewardsChevronBg} flex items-center justify-center`}
              aria-label={effectiveWalletOpenRows3to5 ? 'Close all SpCoin Account Rows' : 'Open all SpCoin Account Rows'}
              title={effectiveWalletOpenRows3to5 ? 'Close all SpCoin Account Rows' : 'Open all SpCoin Account Rows'}
              onClick={() => setWalletRows3to5Open(walletKey, !effectiveWalletOpenRows3to5)}
            >
              {effectiveWalletOpenRows3to5 ? (
                <ChevronUp className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
              ) : (
                <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
              )}
            </button>
          </div>
        </td>

        <td className={`${zebraTw} ${msTableTw.td5}`} title={labelTitle}>
          <div className={`${msTableTw.tdInner5} ${COIN_ROW_TEXT_TW} ${COIN_ROW_PY_TW} ${COIN_ROW_MIN_H_TW} whitespace-nowrap`}>Rewards</div>
        </td>

        <td className={`${zebraTw} ${msTableTw.td}`}>
          <div className={`${msTableTw.tdInner} ${COIN_ROW_VALUE_TW} ${COIN_ROW_PY_TW} ${COIN_ROW_MIN_H_TW} text-left flex justify-start`}>0.0</div>
        </td>

        <td className={`${zebraTw} ${msTableTw.td5}`}>
          <div className={`${msTableTw.tdInnerCenter5} ${COIN_ROW_MIN_H_TW}`}>
            <button
              type="button"
              className={`${claimBtnTw} ${COIN_ROW_BTN_TW} !min-w-0 !w-auto ${BTN_XPAD_HALF_TW} inline-flex`}
              aria-label={actionText}
              title={actionText}
              onClick={() => claimRewards(AccountType.ALL, walletIndex, 'Rewards')}
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
      <AddressSelect defaultAddress={undefined} bypassDefaultFsm callingParent={'ManageAccount'} useActiveAddr={true} shortAddr={true} preText={inputAccountText} />

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
              <th scope="col" className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${msTableTw.colFit} sticky top-0 z-20 !p-0 w-[17px] min-w-[17px]`}>
                <div className="relative w-full h-full">
                  {effectiveChevronOpenPending ? (
                    <button
                      type="button"
                      className={`absolute inset-0 m-0 p-0 rounded-md ${GLOBAL_CHEVRON_UP_BG} flex items-center justify-center`}
                      aria-label="Chevron Up (Close all wallet rows)"
                      title="Close all wallet rows"
                      onClick={() => setGlobalChevronOpen(false)}
                    >
                      <ChevronUp className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`absolute inset-0 m-0 p-0 rounded-md ${GLOBAL_CHEVRON_DOWN_BG} flex items-center justify-center`}
                      aria-label="Chevron Down (Open all Sponsorship Account Rows)"
                      title="Open all account rows"
                      onClick={() => setGlobalChevronOpen(true)}
                    >
                      <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                    </button>
                  )}
                </div>
              </th>

              <th scope="col" className={`${msTableTw.th5} ${msTableTw.th5Pad3} ${msTableTw.colFit} sticky top-0 z-20`}>
                {roleLabel}
              </th>

              <th scope="col" className={`${msTableTw.th} ${msTableTw.thPad3} text-left sticky top-0 z-20`}>
                {middleHeaderLabel}
              </th>

              <th scope="col" className={`${msTableTw.th5} ${msTableTw.th5Pad3} text-center ${msTableTw.colFit} sticky top-0 z-20`}>
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

              const walletKey = String((w as any)?.id ?? addressText ?? i);
              const stableKey = (w as any)?.id ?? `${i}-${addressText}`;

              const st = openByWalletKey[walletKey] ?? EMPTY_SUBROWS;
              const openAll = !!st.all;
              const openStaked = !!st.staked;
              const openSponsor = !!st.sponsor;
              const openRecipient = !!st.recipient;
              const openAgent = !!st.agent;

              const showRow2 = showUnSponsorRow || cfgChevronOpen || openAll || openStaked;
              const showRow3 = vSponsors || cfgChevronOpen || openAll || openSponsor;
              const showRow4 = vRecipients || cfgChevronOpen || openAll || openRecipient;
              const showRow5 = vAgents || cfgChevronOpen || openAll || openAgent;

              const walletOpenRow2 = !!openStaked;
              const walletOpenRows3to5 = openAll || (openSponsor && openRecipient && openAgent);

              const effectiveWalletOpenRow2 = cfgChevronOpen || walletOpenRow2;
              const effectiveWalletOpenRows3to5 = cfgChevronOpen || walletOpenRows3to5;

              const rowChevronBgTop = effectiveWalletOpenRow2 ? ROW_CHEVRON_BG_OPEN : ROW_CHEVRON_BG_CLOSED;

              return (
                <React.Fragment key={stableKey}>
                  <tr className={msTableTw.rowBorder}>
                    <td className={`${zebra} ${msTableTw.td5} !p-0 align-middle w-[17px] min-w-[17px] relative`}>
                      {!isOnlyStaked && (
                        <button
                          type="button"
                          className={`absolute inset-0 m-0 p-0 ${rowChevronBgTop} flex items-center justify-center`}
                          aria-label={effectiveWalletOpenRow2 ? 'Close Staked row' : 'Open Staked SpCoin Quantity'}
                          title={effectiveWalletOpenRow2 ? 'Close Staked row' : 'Open Staked SpCoin Quantity'}
                          onClick={() => setWalletRow2Open(walletKey, !effectiveWalletOpenRow2)}
                        >
                          {effectiveWalletOpenRow2 ? (
                            <ChevronUp className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                          ) : (
                            <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
                          )}
                        </button>
                      )}
                    </td>

                    <td className={`${zebra} ${msTableTw.td5} px-0 ${DATALIST_ROW_PY_TW} align-middle`}>
                      <div className={`${msTableTw.tdInnerCenter5} !p-0`}>
                        <button
                          type="button"
                          className="bg-transparent p-0 m-0 hover:opacity-90 focus:outline-none"
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
                            className={`${DATALIST_IMG_TW} object-contain rounded bg-transparent`}
                          />
                        </button>
                      </div>
                    </td>

                    <td className={`${zebra} ${msTableTw.td} px-0 align-middle`}>
                      <div className="w-full min-w-0 flex flex-col items-start justify-center text-left">
                        <div className="w-full font-semibold truncate !text-[#5981F3] text-left">{w?.name ?? 'Unknown'}</div>
                        <div className="w-full text-sm truncate !text-[#5981F3] text-left">{w?.symbol ?? ''}</div>
                      </div>
                    </td>

                    <td className={`${zebra} ${msTableTw.td5} px-0 align-middle`}>
                      <div className={msTableTw.tdInnerCenter5} />
                    </td>
                  </tr>

                  {renderRewardsSummaryRow(zebra, walletKey, i, effectiveWalletOpenRows3to5)}

                  {showRow2 ? renderClaimCoinRow(zebra, 'Staked', '0.0', AccountType.SPONSOR, 99, i) : null}
                  {showRow3 ? renderClaimCoinRow(zebra, 'Sponsor', '0.0', AccountType.SPONSOR, 0, i) : null}
                  {showRow4 ? renderClaimCoinRow(zebra, 'Recipient', '0.0', AccountType.RECIPIENT, 1, i) : null}
                  {showRow5 ? renderClaimCoinRow(zebra, 'Agent', '0.0', AccountType.AGENT, 2, i) : null}
                </React.Fragment>
              );
            })}

            {(() => {
              const isA = walletList.length % 2 === 0;
              const zebra = isA ? msTableTw.rowA : msTableTw.rowB;
              const actionTw = isA ? msTableTw.btnOrange : msTableTw.btnGreen;

              return (
                <tr className={msTableTw.rowBorder}>
                  <td className={`${zebra} ${msTableTw.td5} !p-0 align-middle w-[17px] min-w-[17px]`}>
                    <div className="w-full h-full" />
                  </td>

                  <td className={`${zebra} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      <span className="text-xl md:text-2xl font-bold tracking-wide">Total</span>
                    </div>
                  </td>

                  <td className={`${zebra} ${msTableTw.td}`}>
                    <div className={msTableTw.tdInnerCenter}>0</div>
                  </td>

                  <td className={`${zebra} ${msTableTw.td5}`}>
                    <div className={msTableTw.tdInnerCenter5}>
                      <button
                        type="button"
                        className={`${actionTw} ${BTN_XPAD_HALF_TW} !min-w-0 !w-auto inline-flex`}
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

      {showToDo && <ToDo show message="ToDo" opacity={0.5} color="#ff1a1a" zIndex={2000} onDismiss={doToDo} />}
    </>
  );
}
