// File: @/components/views/ManageSponsorships/AccountInfo.tsx
'use client';

import React, { useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';

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

export default function DisplayInfo({ account }: Props) {
  const router = useRouter();
  // ✅ Hooks must run on every render (even when account is undefined)
  const ctx = useContext(ExchangeContextState);

  // ✅ ACCOUNT_PANEL child visibility (to label the “Deposit Account” row correctly)
  const vActiveSponsor = usePanelVisible(SP_COIN_DISPLAY.SPONSOR_ACCOUNT);
  const vActiveRecipient = usePanelVisible(SP_COIN_DISPLAY.RECIPIENT_ACCOUNT);
  const vActiveAgent = usePanelVisible(SP_COIN_DISPLAY.AGENT_ACCOUNT);

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
  const website = (account?.website ?? '').toString().trim();
  const email = (
    (account as any)?.email ??
    (account as any)?.emailAddress ??
    (account as any)?.contactEmail ??
    ''
  )
    .toString()
    .trim();

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 py-3 text-sm align-middle';
  const valueWrap = 'whitespace-normal break-words mr-[5px]';
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';

  // After hooks have run, you can short-circuit rendering if no account
  if (!account) return null;

  // ✅ This is the connected/active account address shown in the pill
  const depositAddrRaw = ctx?.exchangeContext?.accounts?.activeAccount?.address ?? '';
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
        className="scrollbar-hide mb-4 mt-0 overflow-x-hidden overflow-y-auto rounded-xl border border-black"
      >
        <table id="MANAGE ACCOUNT TABLE" className="w-full table-fixed border-collapse">
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
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>Name</td>
              <td className={`${zebraA} ${cell}`}>
                <div className={valueWrap}>{name}</div>
              </td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>Symbol</td>
              <td className={`${zebraB} ${cell}`}>
                <div className={valueWrap}>{symbol}</div>
              </td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>address:</td>
              <td className={`${zebraA} ${cell}`}>
                <div className={valueWrap}>
                  <span className="font-mono break-all">{fallback(address)}</span>
                </div>
              </td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>webSite</td>
              <td className={`${zebraB} ${cell}`}>
                <div className={valueWrap}>
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
                </div>
              </td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>email:</td>
              <td className={`${zebraA} ${cell}`}>
                <div className={valueWrap}>
                  {email ? (
                    <a
                      href={email.startsWith('mailto:') ? email : `mailto:${email}`}
                      className="break-all underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200"
                    >
                      {email.replace(/^mailto:/i, '')}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
              </td>
            </tr>

            <tr>
              <td className={`${zebraB} ${cell}`}>
                description:
              </td>
              <td className={`${zebraB} ${cell}`}>
                <div className={valueWrap}>{description}</div>
              </td>
            </tr>

            <tr>
              <td colSpan={2} className={`${zebraA} p-0`}>
                  <button
                    type="button"
                    onClick={() => router.push('/createAccount')}
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
