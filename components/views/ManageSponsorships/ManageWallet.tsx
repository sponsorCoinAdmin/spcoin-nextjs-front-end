// File: @/components/views/ManageSponsorships/ManageWallet.tsx
'use client';

import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { WalletAccount } from '@/lib/structure';
import { AccountType } from '@/lib/structure';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';
import ToDo from '@/lib/utils/components/ToDo';

type Props = {
  wallet?: WalletAccount;
};

function addressToText(addr: unknown): string {
  if (addr == null) return 'N/A';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const a = addr as Record<string, unknown>;
    const candidates = [a['address'], a['hex'], a['bech32'], a['value'], a['id']].filter(
      Boolean,
    ) as string[];
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

export default function ManageWallet({ wallet }: Props) {
  // ✅ Hooks must run on every render (even when wallet is undefined)
  const ctx = useContext(ExchangeContextState);

  // Derive a best-effort AccountType from wallet metadata; default to AGENT
  const accountType: AccountType = useMemo(() => {
    const t = (wallet as any)?.type?.toString().toLowerCase?.() ?? '';
    if (t.includes('recipient')) return AccountType.RECIPIENT;
    if (t.includes('sponsor')) return AccountType.SPONSOR;
    if (t.includes('agent')) return AccountType.AGENT;
    const n = (wallet as any)?.name?.toString().toLowerCase?.() ?? '';
    if (n.includes('recipient')) return AccountType.RECIPIENT;
    if (n.includes('sponsor')) return AccountType.SPONSOR;
    return AccountType.AGENT;
  }, [wallet]);

  const address = addressToText(wallet?.address);
  const name = fallback(wallet?.name);
  const symbol = fallback(wallet?.symbol);
  const description = fallback(wallet?.description);
  const logoURL = (wallet?.logoURL ?? '').toString().trim();
  const website = (wallet?.website ?? '').toString().trim();
  const stakedBalance = 0;
  const pendingBalance = 0;

  const [showToDo, setShowToDo] = useState<boolean>(false);
  const pendingClaimRef = useRef<{ type: AccountType } | null>(null);

  // Trigger ToDo (store intent, then show red overlay)
  const claimRewards = useCallback((type: AccountType) => {
    pendingClaimRef.current = { type };
    setShowToDo(true);
  }, []);

  // When ToDo is dismissed, show the alert and hide overlay
  const doToDo = useCallback(() => {
    setShowToDo(false);

    const connected = ctx?.exchangeContext?.accounts?.activeAccount;
    const pending = pendingClaimRef.current ?? { type: accountType };

    // eslint-disable-next-line no-alert
    alert(
      [
        'ToDo:(Not Yet Implemented)',
        `Claim ${pending.type.toString()} Rewards`,
        `From: ${name.toString()}`,
        `From Account: ${address.toString()}`,
        `For account: ${connected ? connected.address : '(none connected)'}`,
      ].join('\n'),
    );
  }, [accountType, ctx?.exchangeContext?.accounts?.activeAccount, name, address]);

  const th =
    'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 py-3 text-sm align-middle';
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';

  // After hooks have run, you can short-circuit rendering if no wallet
  if (!wallet) return null;

  return (
    <div id="msWallet">
      {/*
        NOTE:
        We intentionally removed the AddressSelect “Deposit Account” header block from this panel,
        because it was being rendered in a parent panel too, resulting in duplicate lines.
      */}

      <div
        id="msWrapperWalletKV"
        className="mb-4 -mt-[20px] overflow-x-auto overflow-y-auto rounded-xl border border-black"
      >
        <table id="msTableWalletKV" className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th scope="col" className={th}>
                Name
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
                {logoURL ? (
                  <span className="break-all text-xs text-slate-200">{logoURL}</span>
                ) : (
                  'N/A'
                )}
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

      {/* Claim Rewards button under the table — uses ToDo flow */}
      <div className="mb-6 flex items-center justify-start">
        <button
          type="button"
          className="ms-claim--green"
          aria-label="Claim Rewards"
          onClick={() => claimRewards(accountType)}
        >
          Claim Rewards
        </button>
      </div>

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

      {/* Styles (container-scoped, with !important), mirroring ClaimSponsorRewardsList strategy */}
      <style jsx>{`
        #msWrapperWalletKV {
          border-color: #000 !important;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        #msWrapperWalletKV::-webkit-scrollbar {
          display: none;
        }
        #msTableWalletKV thead tr,
        #msTableWalletKV thead th {
          background-color: #2b2b2b !important;
        }
        #msTableWalletKV thead tr {
          border-bottom: 1px solid #000 !important;
        }
        #msTableWalletKV tbody td {
          padding: 0.75rem 0.75rem !important;
        }

        /* 🔑 MATCHED STRATEGY: scope to a container id (higher specificity) */
        #msWallet .ms-claim--green {
          background-color: #147f3bff !important;
          color: #ffffff !important;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
          transition: background-color 0.2s ease;
        }
        #msWallet .ms-claim--green:hover {
          background-color: #22c55e !important;
          color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
