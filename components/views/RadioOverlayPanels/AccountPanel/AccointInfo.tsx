// File: @/components/views/ManageSponsorships/AccountInfo.tsx
'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import {
  accountRegistry,
  getAccountRegistryRecord,
  type AccountRegistryRecord,
} from '@/lib/context/accounts/accountRegistry';
import { ACCOUNT_REGISTRY_UPDATED_EVENT } from '@/lib/accounts/accountEvents';

// ✅ Use the same table theme module used by AccountListRewardsPanel
import { msTableTw } from '@/components/views/RadioOverlayPanels/msTableTw';

function addressToText(addr: unknown): string {
  if (addr == null) return 'N/A';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const a = addr as Record<string, unknown>;
    const candidates = [a['address'], a['hex'], a['bech32'], a['value'], a['id']].filter(Boolean) as string[];
    if (candidates.length > 0) return String(candidates[0]);
    try {
      return JSON.stringify(addr);
    } catch {
      return String(addr);
    }
  }
  return String(addr);
}

const fallback = (v: unknown) => {
  const s = (v ?? '').toString().trim();
  return s || 'N/A';
};

function formatShortAddress(addr: string) {
  const a = (addr ?? '').toString().trim();
  if (!a) return '';

  if (a.length <= 36) return ` ${a} `;
  const start = a.slice(0, 15);
  const end = a.slice(-15);
  return ` ${start} ... ${end} `;
}

function normalizeAddressKey(value: unknown) {
  return (value ?? '').toString().trim().toLowerCase();
}

export default function DisplayInfo() {
  const router = useRouter();
  const ctx = useContext(ExchangeContextState);
  const accounts = ctx?.exchangeContext?.accounts;
  const [registryRefreshTick, setRegistryRefreshTick] = useState(0);

  // ✅ ACCOUNT_PANEL child visibility (to label the “Deposit Account” row correctly)
  const vActiveAccount = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_ACCOUNT);
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);

  const depositLabel = useMemo(() => {
    if (vActiveAccount) return 'Active Account:';
    if (vActiveSponsor) return 'Sponsor Account:';
    if (vActiveRecipient) return 'Recipient Account:';
    if (vActiveAgent) return 'Agent Account:';
    return 'Account:';
  }, [vActiveAccount, vActiveSponsor, vActiveRecipient, vActiveAgent]);

  const slotAccount = useMemo(() => {
    if (!accounts) return undefined;
    if (vActiveAccount) return accounts.activeAccount;
    if (vActiveSponsor) return accounts.sponsorAccount;
    if (vActiveRecipient) return accounts.recipientAccount;
    if (vActiveAgent) return accounts.agentAccount;
    return accounts.activeAccount;
  }, [accounts, vActiveAccount, vActiveSponsor, vActiveRecipient, vActiveAgent]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onRegistryUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ address?: string }>).detail;
      const changedKey = normalizeAddressKey(detail?.address);
      const currentKey = normalizeAddressKey(slotAccount?.address);

      if (changedKey && currentKey && changedKey !== currentKey) return;
      setRegistryRefreshTick((prev) => prev + 1);
    };

    window.addEventListener(
      ACCOUNT_REGISTRY_UPDATED_EVENT,
      onRegistryUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        ACCOUNT_REGISTRY_UPDATED_EVENT,
        onRegistryUpdated as EventListener,
      );
    };
  }, [slotAccount?.address]);

  const accountToRender = useMemo(() => {
    const slotAddress =
      typeof slotAccount?.address === 'string' ? slotAccount.address.trim() : '';
    if (!slotAddress) return slotAccount;

    return (
      getAccountRegistryRecord<AccountRegistryRecord>(
        accountRegistry,
        slotAddress,
      ) ?? slotAccount
    );
  }, [slotAccount, registryRefreshTick]);

  const canEditAccount =
    normalizeAddressKey(accountToRender?.address) !== '' &&
    normalizeAddressKey(accountToRender?.address) === normalizeAddressKey(accounts?.activeAccount?.address);

  const address = addressToText(accountToRender?.address);
  const name = fallback(accountToRender?.name);
  const symbol = fallback(accountToRender?.symbol);
  const description = fallback(accountToRender?.description);
  const website = (accountToRender?.website ?? '').toString().trim();
  const email = (
    (accountToRender as any)?.email ??
    (accountToRender as any)?.emailAddress ??
    (accountToRender as any)?.contactEmail ??
    ''
  )
    .toString()
    .trim();

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 py-3 text-sm align-middle';
  const valueWrap = 'box-border w-full whitespace-normal break-all pr-[5px]';
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';
  const tableGrid = 'grid grid-cols-[max-content_minmax(0,1fr)]';

  // After hooks have run, you can short-circuit rendering if no account
  if (!accountToRender) return null;

  // ✅ This is the connected/active account address shown in the pill
  const depositAddrRaw = accountToRender?.address ?? '';
  const depositAddr = formatShortAddress(String(depositAddrRaw ?? '').trim());

  return (
    <div id="ACCOUNT_INFO">
      {/* Active Account header (short label pill) */}
      {depositAddr ? (
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-300/80">
          <span className="whitespace-nowrap">{depositLabel}</span>
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 py-1 gap-2 bg-[#243056] text-[#5981F3] text-base w-full mb-0 rounded-[22px]">
            <span className="w-full text-center font-mono break-all">{depositAddr}</span>
          </div>
        </div>
      ) : null}

      <div
        id="MANAGE ACCOUNT"
        className="scrollbar-hide mb-4 mt-0 w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-xl border border-black"
      >
        <div id="MANAGE ACCOUNT TABLE" className={`${tableGrid} w-full min-w-0`}>
          <div className="contents">
            <div className={`${msTableTw.theadRow} ${th} whitespace-nowrap border-b border-black`}>Field Name</div>
            <div className={`${msTableTw.theadRow} ${th} border-b border-black`}>value</div>
          </div>

          <div className="contents">
            <div className={`${zebraA} ${cell} whitespace-nowrap border-b border-black`}>Name</div>
            <div className={`${zebraA} ${cell} min-w-0 border-b border-black`}>
              <div className={valueWrap}>{name}</div>
            </div>
          </div>

          <div className="contents">
            <div className={`${zebraB} ${cell} whitespace-nowrap border-b border-black`}>Symbol</div>
            <div className={`${zebraB} ${cell} min-w-0 border-b border-black`}>
              <div className={valueWrap}>{symbol}</div>
            </div>
          </div>

          <div className="contents">
            <div className={`${zebraA} ${cell} whitespace-nowrap border-b border-black`}>address:</div>
            <div className={`${zebraA} ${cell} min-w-0 border-b border-black`}>
              <div className={valueWrap}>
                <span className="block w-full font-mono break-all">{fallback(address)}</span>
              </div>
            </div>
          </div>

          <div className="contents">
            <div className={`${zebraB} ${cell} whitespace-nowrap border-b border-black`}>webSite</div>
            <div className={`${zebraB} ${cell} min-w-0 border-b border-black`}>
              <div className={valueWrap}>
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full break-all underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200"
                  >
                    {website}
                  </a>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
          </div>

          <div className="contents">
            <div className={`${zebraA} ${cell} whitespace-nowrap border-b border-black`}>email:</div>
            <div className={`${zebraA} ${cell} min-w-0 border-b border-black`}>
              <div className={valueWrap}>
                {email ? (
                  <a
                    href={email.startsWith('mailto:') ? email : `mailto:${email}`}
                    className="block w-full break-all underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200"
                  >
                    {email.replace(/^mailto:/i, '')}
                  </a>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
          </div>

          <div className={`${zebraB} ${cell} col-span-2 min-w-0`}>
            <div className="mb-2 text-center whitespace-nowrap">Description:</div>
            <div className={valueWrap}>{description}</div>
          </div>

          {canEditAccount ? (
            <div className={`${zebraA} col-span-2 p-0`}>
              <button
                type="button"
                onClick={() => router.push('/EditAccount')}
                className={[
                  'flex items-center justify-center',
                  'text-[#5981F3]',
                  'bg-[#243056]',
                  'w-full h-[55px]',
                  'text-[20px] font-bold',
                  'rounded-[12px]',
                  'transition-[color,background-color] duration-300',
                  'hover:cursor-pointer hover:text-green-500',
                ].join(' ')}
              >
                Edit Account
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
