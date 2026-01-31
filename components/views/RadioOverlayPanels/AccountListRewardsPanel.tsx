// File: @/components/views/RadioOverlayPanels/AccountListRewardsPanel.tsx
'use client';

import React, { useMemo, useState, useCallback, useContext, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

import type { spCoinAccount } from '@/lib/structure';
import { SP_COIN_DISPLAY, AccountType } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { panelStore } from '@/lib/context/exchangeContext/panelStore';
import ToDo from '@/lib/utils/components/ToDo';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import AddressSelect from '../AssetSelectPanels/AddressSelect';
import { createDebugLogger } from '@/lib/utils/debugLogger';

import { msTableTw } from './msTableTw';

// ✅ Use the requested debug logger config
const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_ASSET_SELECT === 'true';
const debugLog = createDebugLogger('AssetListSelectPanel', DEBUG_ENABLED, LOG_TIME);

type REWARDS_LIST_MODE =
  | SP_COIN_DISPLAY.AGENTS
  | SP_COIN_DISPLAY.RECIPIENTS
  | SP_COIN_DISPLAY.SPONSORS
  | SP_COIN_DISPLAY.UNSPONSOR_SP_COINS;

type Props = {
  accountList: spCoinAccount[];
  setAccountCallBack: (wallet?: spCoinAccount) => void;

  /** REQUIRED: selector panel container type */
  containerType: SP_COIN_DISPLAY;

  /** SSOT: determines which actions/columns this list should show */
  listType: REWARDS_LIST_MODE;
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

function getAddressText(w: any): string {
  if (typeof w?.address === 'string') return w.address;

  const a = w?.address as Record<string, unknown> | undefined;
  if (!a) return 'N/A';

  const cand = a['address'] ?? a['hex'] ?? a['bech32'] ?? a['value'] ?? a['id'];
  try {
    return cand ? String(cand) : JSON.stringify(a);
  } catch {
    return 'N/A';
  }
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
 * ✅ width of nested col[0] for account type rows
 */
const COL_0_ACCOUNT_TYPE = '88px';

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
 * Requirement: Down = green, Up = orange.
 */
const ROW_CHEVRON_BG_UP = 'bg-orange-500';
const ROW_CHEVRON_BG_DOWN = 'bg-green-500';

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
 * ✅ HIDE ALL TABLE LINES / DIVIDERS (parent table)
 */
const ROW_OUTLINE_TW = '';
const CELL_VDIV_TW = '';
const CELL_LEFT_OUTLINE_TW = '';
const CELL_RIGHT_OUTLINE_TW = '';

/**
 * ✅ EXACT aria-labels requested for Claim/Unstake buttons
 */
function getActionButtonAriaLabel(buttonText: string, label: string) {
  if (buttonText === 'Claim' && label === 'Sponsor') return 'Claim Sponsor SpCoin Rewards';
  if (buttonText === 'Claim' && label === 'Recipient') return 'Claim Recipient SpCoin Rewards';
  if (buttonText === 'Claim' && label === 'Agent') return 'Claim Agent SpCoin Rewards';
  if (buttonText === 'Unstake' && label === 'Staked') return 'Unstake SpCoins';
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

/**
 * Smooth expand/collapse wrapper (works reliably for table rows by animating inside content).
 */
function ExpandWrap({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={[
        'grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out',
        open ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1',
      ].join(' ')}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function AccountCell({
  account,
  roleLabel,
  addressText,
  onPick,
  onRowEnter,
  onRowMove,
  onRowLeave,
}: {
  account: spCoinAccount;
  roleLabel: string;
  addressText: string;
  onPick: (a: spCoinAccount) => void;
  onRowEnter: (name?: string | null) => void;
  onRowMove: React.MouseEventHandler;
  onRowLeave: () => void;
}) {
  return (
    <div className="w-full flex items-center gap-2 min-w-0">
      <button
        type="button"
        className="bg-transparent p-0 m-0 hover:opacity-90 focus:outline-none"
        onMouseEnter={() => onRowEnter(account?.name ?? '')}
        onMouseMove={onRowMove}
        onMouseLeave={onRowLeave}
        onClick={() => onPick(account)}
        aria-label={`Open ${roleLabel}s reconfigure`}
        data-role={roleLabel}
        data-address={addressText}
      >
        <Image
          src={(account as any)?.logoURL || '/assets/miscellaneous/placeholder.png'}
          alt={`${account?.name ?? 'Wallet'} logo`}
          width={DATALIST_IMG_PX}
          height={DATALIST_IMG_PX}
          className={`${DATALIST_IMG_TW} object-contain rounded bg-transparent`}
        />
      </button>

      <div className="min-w-0 flex-1 flex flex-col items-start justify-center text-left">
        <div className="w-full font-semibold truncate !text-[#5981F3] text-left">{account?.name ?? 'Unknown'}</div>
        <div className="w-full text-sm truncate !text-[#5981F3] text-left">{(account as any)?.symbol ?? ''}</div>
      </div>
    </div>
  );
}

export default function AccountListRewardsPanel({ accountList, setAccountCallBack, containerType, listType }: Props) {
  const ctx = useContext(ExchangeContextState);

  const vAgents = usePanelVisible(SP_COIN_DISPLAY.AGENTS);
  const vRecipients = usePanelVisible(SP_COIN_DISPLAY.RECIPIENTS);
  const vSponsors = usePanelVisible(SP_COIN_DISPLAY.SPONSORS);

  // claim config flags (buttons only; rows do NOT auto-open off these)
  const cfgClaimAgent = usePanelVisible(SP_COIN_DISPLAY.PENDING_AGENT_COINS);
  const cfgClaimRecipient = usePanelVisible(SP_COIN_DISPLAY.PENDING_RECIPIENT_COINS);
  const cfgClaimSponsor = usePanelVisible(SP_COIN_DISPLAY.PENDING_SPONSOR_COINS);

  const showUnSponsorRow = usePanelVisible(SP_COIN_DISPLAY.UNSPONSOR_SP_COINS);

  // ✅ Global open-all flag
  const cfgChevronOpen: boolean = usePanelVisible(SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING);

  const [chevronOpenPending, setChevronOpenPending] = useState<boolean>(false);
  const [openByWalletKey, setOpenByWalletKey] = useState<OpenByWalletKey>({});

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

  const effectiveChevronOpenPending = cfgChevronOpen || chevronOpenPending;

  const setGlobalChevronOpen = useCallback(
    (open: boolean) => {
      debugLog.log?.('[global chevron]', { open });

      setChevronOpenPending(open);

      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(LS_CHEVRON_OPEN_KEY, String(open));
      } catch {
        // no-op
      }

      setPanelVisibleEverywhere(ctx, SP_COIN_DISPLAY.CHEVRON_DOWN_OPEN_PENDING, open);
    },
    [ctx],
  );

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

  const inputAccountText = useMemo(() => getInputAccountText({ vAgents, vRecipients, vSponsors }), [vAgents, vRecipients, vSponsors]);

  const [showToDo, setShowToDo] = useState<boolean>(false);
  const pendingClaimRef = useRef<PendingClaim | null>(null);

  const [tip, setTip] = useState<{ show: boolean; text: string; x: number; y: number }>({
    show: false,
    text: '',
    x: 0,
    y: 0,
  });

  // ✅ accountRole1 / accountRole2 mapping (per requirements)
  const { accountRole1, accountRole2 } = useMemo(() => {
    if (cfgClaimSponsor) return { accountRole1: 'Recipient', accountRole2: 'Agent' };
    if (cfgClaimRecipient) return { accountRole1: 'Sponsor', accountRole2: 'Agent' };
    if (cfgClaimAgent) return { accountRole1: 'Recipient', accountRole2: 'Sponsor' };
    return { accountRole1: 'Accounts', accountRole2: 'Accounts' };
  }, [cfgClaimSponsor, cfgClaimRecipient, cfgClaimAgent]);

  // ✅ Rewards row should ONLY show if any pending-coin flag is active
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
      listTypeLabel: SP_COIN_DISPLAY[listType],
      pending,
      label,
      isTotal,
      rowName,
      rowAccount,
      sponsorConnected: connected ? connected.address : '(not connected)',
    });
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, accountList, listType]);

  const actionButtonLabel =
    listType === SP_COIN_DISPLAY.UNSPONSOR_SP_COINS
      ? 'Unsponsor'
      : listType === SP_COIN_DISPLAY.SPONSORS
        ? 'Claim'
        : 'Action';

  const actionButtonText = actionButtonLabel === 'Claim' ? 'Claim All' : actionButtonLabel;

  const onRowEnter = (name?: string | null) => setTip((t) => ({ ...t, show: true, text: name ?? '' }));
  const onRowMove: React.MouseEventHandler = (e) => setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
  const onRowLeave = () => setTip((t) => ({ ...t, show: false }));

  // ✅ Sponsor-mode helper (UNSPONSOR or PENDING_SPONSOR)
  const isSponsorMode = showUnSponsorRow || cfgClaimSponsor;

  const setWalletRows3to5Open = useCallback((walletKey: string, open: boolean) => {
    setOpenByWalletKey((prev) => {
      const cur = prev[walletKey] ?? EMPTY_SUBROWS;
      const nextForKey: SubRowOpenState = {
        ...cur,
        sponsor: open,
        recipient: open,
        agent: open,
        staked: open,
      };
      return { ...prev, [walletKey]: nextForKey };
    });
  }, []);

  // ✅ Default account fg color = WHITE now, with conditional light-green overrides
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

  const renderRewardsTable = useCallback(
    (args: {
      zebra: string;
      walletKey: string;
      walletIndex: number;
      tokenRowVisible: boolean;
      showRow3: boolean;
      showRow4: boolean;
      showRow5: boolean;
      rewardsOpen: boolean;
    }) => {
      const { zebra, walletKey, walletIndex, tokenRowVisible, showRow3, showRow4, showRow5, rewardsOpen } = args;

      // ✅ REMOVE ALL NESTED TABLE CELL BORDERS
      const nestedCellTw = '';
      const nestedOuterTw = '';
      const nestedVdivTw = '';

      const renderChevronBtn = (isOpen: boolean) => (
        <button
          type="button"
          className={`m-0 p-0 rounded-md ${isOpen ? ROW_CHEVRON_BG_UP : ROW_CHEVRON_BG_DOWN} flex items-center justify-center shrink-0`}
          aria-label={isOpen ? 'Close all SpCoin Account Rows' : 'Open all SpCoin Account Rows'}
          title={isOpen ? 'Close all SpCoin Account Rows' : 'Open all SpCoin Account Rows'}
          onClick={() => setWalletRows3to5Open(walletKey, !isOpen)}
        >
          {isOpen ? (
            <ChevronUp className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
          ) : (
            <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
          )}
        </button>
      );

      const renderNestedRewardsRow = () => {
        if (!showRewardsRow) return null;

        const claimBtnTw = msTableTw.btnGreen;
        const actionText = 'Claim SpCoin Rewards';
        const labelTitle = 'Pending SpCoin Rewards';
        const isOpen = rewardsOpen;

        return (
          <tr aria-hidden={false}>
            <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw}`} title={labelTitle}>
              <ExpandWrap open={true}>
                <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
                  <div className="min-w-0 flex items-center gap-2">
                    {renderChevronBtn(isOpen)}
                    <div
                      className={`${COIN_ROW_TEXT_TW} whitespace-nowrap overflow-hidden text-ellipsis shrink-0`}
                      style={{ width: COL_0_ACCOUNT_TYPE }}
                    >
                      Rewards
                    </div>
                    <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>0.0</div>
                  </div>

                  <button
                    type="button"
                    className={`${claimBtnTw} ${COIN_ROW_BTN_TW} !min-w-0 !w-auto ${BTN_XPAD_HALF_TW} inline-flex shrink-0`}
                    aria-label={actionText}
                    title={actionText}
                    onClick={() => claimRewards(AccountType.ALL, walletIndex, 'Rewards')}
                  >
                    Claim
                  </button>
                </div>
              </ExpandWrap>
            </td>
          </tr>
        );
      };

      const renderNestedTokenContractRow = (open: boolean) => (
        <tr aria-hidden={!open}>
          <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw}`}>
            <ExpandWrap open={open}>
              <div className={`${COIN_ROW_MIN_H_TW} flex items-center justify-center`}>
                <div className="w-full text-center truncate text-[14.3px] leading-[1.15] !text-[#5981F3]">
                  Sponsor Coin Sponsorship Details
                </div>
              </div>
            </ExpandWrap>
          </td>
        </tr>
      );

      const renderNestedClaimRow = (
        open: boolean,
        label: string,
        valueText: string,
        type: AccountType,
        withChevron?: boolean,
      ) => {
        const btnTw = msTableTw.btnGreen;

        const isUnstakeRow = label === 'Staked';
        const buttonText = 'Unstake';

        const showButton = isUnstakeRow ? isSponsorMode : false;
        const actionText = getActionButtonAriaLabel(buttonText, label);
        const labelTitle = getRowLabelTitle(label);

        const fgTw = getClaimRowFgTw(label);

        if (!isUnstakeRow) {
          return (
            <tr aria-hidden={!open}>
              <td
                className={`${msTableTw.td} !p-0 ${nestedCellTw} ${nestedVdivTw} ${fgTw} align-middle !text-left`}
                title={labelTitle}
              >
                <ExpandWrap open={open}>
                  <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} w-full flex items-center gap-2`}>
                    {withChevron ? renderChevronBtn(rewardsOpen) : null}
                    <div
                      className={`${COIN_ROW_TEXT_TW} whitespace-nowrap overflow-hidden text-ellipsis shrink-0`}
                      style={{ width: COL_0_ACCOUNT_TYPE }}
                    >
                      {label}
                    </div>
                  </div>
                </ExpandWrap>
              </td>

              <td className={`${msTableTw.td} !p-0 ${nestedCellTw} ${fgTw} align-middle !text-left`} title={labelTitle}>
                <ExpandWrap open={open}>
                  <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} w-full flex items-center justify-start`}>
                    <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>{valueText}</div>
                  </div>
                </ExpandWrap>
              </td>
            </tr>
          );
        }

        // Staked row (spans both cols)
        return (
          <tr aria-hidden={!open}>
            <td colSpan={2} className={`${msTableTw.td} !p-0 ${nestedCellTw}`} title={labelTitle}>
              <ExpandWrap open={open}>
                <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
                  <div className={`min-w-0 flex items-center gap-2 ${fgTw}`}>
                    {withChevron ? renderChevronBtn(rewardsOpen) : null}
                    <div
                      className={`${COIN_ROW_TEXT_TW} whitespace-nowrap overflow-hidden text-ellipsis shrink-0`}
                      style={{ width: COL_0_ACCOUNT_TYPE }}
                    >
                      {label}
                    </div>
                    <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>{valueText}</div>
                  </div>

                  <button
                    type="button"
                    className={`${btnTw} ${COIN_ROW_BTN_TW} ${showButton ? 'visible' : 'invisible'} !min-w-0 !w-auto ${BTN_XPAD_HALF_TW} inline-flex shrink-0`}
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
              </ExpandWrap>
            </td>
          </tr>
        );
      };

      // ✅ Staked must be visible whenever UNSPONSOR_SP_COINS is active
      const stakedOpen = showUnSponsorRow;

      return (
        <tr>
          <td colSpan={2} className={`${zebra} ${msTableTw.td} !p-0 align-top`}>
            <table className={`w-full table-fixed border-collapse ${nestedOuterTw}`}>
              <colgroup>
                <col style={{ width: COL_0_ACCOUNT_TYPE }} />
                <col />
              </colgroup>

              <tbody>
                {renderNestedRewardsRow()}
                {renderNestedClaimRow(stakedOpen, 'Staked', '0.0', AccountType.SPONSOR, true)}
                {renderNestedTokenContractRow(tokenRowVisible)}
                {renderNestedClaimRow(showRow3, 'Sponsor', '0.0', AccountType.SPONSOR)}
                {renderNestedClaimRow(showRow4, 'Recipient', '0.0', AccountType.RECIPIENT)}
                {renderNestedClaimRow(showRow5, 'Agent', '0.0', AccountType.AGENT)}
              </tbody>
            </table>
          </td>
        </tr>
      );
    },
    [claimRewards, getClaimRowFgTw, isSponsorMode, setWalletRows3to5Open, showRewardsRow, showUnSponsorRow],
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
                    aria-label={effectiveChevronOpenPending ? 'Chevron Up (Close all wallet rows)' : 'Chevron Down (Open all Sponsorship Account Rows)'}
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

              const st = openByWalletKey[walletKey] ?? EMPTY_SUBROWS;
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

                  {renderRewardsTable({
                    zebra,
                    walletKey,
                    walletIndex: i,
                    tokenRowVisible,
                    showRow3,
                    showRow4,
                    showRow5,
                    rewardsOpen,
                  })}
                </React.Fragment>
              );
            })}

            {(() => {
              const zebra = accountList.length % 2 === 0 ? msTableTw.rowA : msTableTw.rowB;
              const actionTw = msTableTw.btnGreen;

              return (
<tr id="REWARDS_TABLE_TOTAL" className={ROW_OUTLINE_TW}>
  <td colSpan={2} className={`${zebra} ${msTableTw.td} !p-0`}>
    <div className={`${COIN_ROW_MIN_H_TW} ${COIN_ROW_PY_TW} flex items-center justify-between gap-2`}>
      <div className="min-w-0 flex items-center gap-2">
        {/* EXACT chevron footprint (invisible clone of the real one) */}
        <button
          type="button"
          className={`m-0 p-0 rounded-md ${ROW_CHEVRON_BG_DOWN} flex items-center justify-center shrink-0 invisible`}
          aria-hidden="true"
          tabIndex={-1}
        >
          <ChevronDown className={`${CHEVRON_ICON_TW} ${CHEVRON_FG_TW}`} />
        </button>

        {/* label column: 50% larger ONLY for "Total" */}
        <div
          className={`${COIN_ROW_TEXT_TW} text-[19.5px] leading-[1.15] whitespace-nowrap overflow-hidden text-ellipsis shrink-0`}
          style={{ width: COL_0_ACCOUNT_TYPE }}
        >
          Total
        </div>

        {/* value: EXACT same styling as Rewards row */}
        <div className={`${COIN_ROW_VALUE_TW} min-w-0 truncate`}>0.0</div>
      </div>

      <button
        type="button"
        className={`${actionTw} ${BTN_XPAD_HALF_TW} !min-w-0 !w-auto inline-flex shrink-0`}
        aria-label={`${actionButtonText} total`}
        onClick={() => claimRewards(accountType, -1, `${actionButtonText} (TOTAL)`)}
      >
        {actionButtonText}
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
