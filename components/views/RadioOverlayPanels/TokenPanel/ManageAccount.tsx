// File: @/components/views/ManageSponsorships/ManageAccount.tsx
'use client';

import React, { useContext, useMemo } from 'react';

import type { spCoinAccount } from '@/lib/structure';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

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

type Props = {
  account?: spCoinAccount;
};

export default function ManageAccount({ account }: Props) {
  // ✅ Hooks must run on every render (even when account is undefined)
  const ctx = useContext(ExchangeContextState);

  // ✅ ACCOUNT_PANEL child visibility (to label the “Deposit Account” row correctly)
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_SPONSOR);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_RECIPIENT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.ACTIVE_AGENT);

  const depositLabel = useMemo(() => {
    if (vActiveSponsor) return 'Sponsor Account:';
    if (vActiveRecipient) return 'Recipient Account:';
    if (vActiveAgent) return 'Agent Account:';
    return 'Account:';
  }, [vActiveSponsor, vActiveRecipient, vActiveAgent]);

  const address = addressToText(account?.address);
  const name = fallback(account?.name);
  const symbol = fallback(account?.symbol);
  const description = fallback(account?.description);
  const logoURL = (account?.logoURL ?? '').toString().trim();
  const website = (account?.website ?? '').toString().trim();
  const stakedBalance = 0;
  const pendingBalance = 0;

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 py-3 text-sm align-middle';
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';

  // After hooks have run, you can short-circuit rendering if no account
  if (!account) return null;

  // ✅ This is the connected/active account address shown in the pill
  const depositAddrRaw = ctx?.exchangeContext?.accounts?.activeAccount?.address ?? '';
  const depositAddr = formatShortAddress(String(depositAddrRaw ?? '').trim());

  return (
    <div id="ACCOUNT_PANEL">
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
        className="mb-4 mt-0 overflow-x-auto overflow-y-auto rounded-xl border border-black"
      >
        <table id="MANAGE ACCOUNT TABLE" className="min-w-full border-collapse">
          <thead>
            {/* ✅ Match AccountListRewardsPanel header background color */}
            <tr className={`${msTableTw.theadRow} border-b border-black`}>
              <th scope="col" className={th}>
                Field Name
              </th>
              <th scope="col" className={th}>
                value
              </th>
            </tr>
          </thead>
          <tbody>
            {/* address first */}
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>address:</td>
              <td className={`${zebraA} ${cell}`}>
                <span className="font-mono break-all">{fallback(address)}</span>
              </td>
            </tr>

            {/* logoURL (URL only) */}
            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>logoURL:</td>
              <td className={`${zebraB} ${cell}`}>
                {logoURL ? <span className="break-all text-xs text-slate-200">{logoURL}</span> : 'N/A'}
              </td>
            </tr>

            {/* Name */}
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>Name</td>
              <td className={`${zebraA} ${cell}`}>{name}</td>
            </tr>

            {/* Symbol */}
            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>Symbol</td>
              <td className={`${zebraB} ${cell}`}>{symbol}</td>
            </tr>

            {/* stakedBalance */}
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>stakedBalance</td>
              <td className={`${zebraA} ${cell}`}>{stakedBalance}</td>
            </tr>

            {/* pendingBalance */}
            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>pendingBalance</td>
              <td className={`${zebraB} ${cell}`}>{pendingBalance}</td>
            </tr>

            {/* webSite */}
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>webSite</td>
              <td className={`${zebraA} ${cell}`}>
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200 break-all"
                  >
                    {website}
                  </a>
                ) : (
                  'N/A'
                )}
              </td>
            </tr>

            {/* description */}
            <tr>
              <td className={`${zebraB} ${cell}`}>description:</td>
              <td className={`${zebraB} ${cell}`}>{description}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
