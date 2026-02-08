// File: @/components/views/RadioOverlayPanels/TokenPanel/index.tsx
'use client';

import React, { useContext } from 'react';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { SP_COIN_DISPLAY, type spCoinAccount } from '@/lib/structure';
import { ExchangeContextState } from '@/lib/context/ExchangeProvider';

// ✅ Use the same table theme module used by AccountListRewardsPanel
import { msTableTw } from '@/components/views/RadioOverlayPanels/msTableTw';

type Props = { onClose?: () => void };

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

/**
 * TokenPanel
 * - Single gate: TOKEN_CONTRACT_PANEL
 * - Displays info for the currently selected token contract (from context)
 */
export default function TokenPanel(_props: Props) {
  // ✅ Single visibility gate
  const vTokenPanel = usePanelVisible(SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL);

  // ✅ Context (hooks must run before any early return)
  const ctx = useContext(ExchangeContextState);
  const ex = ctx?.exchangeContext;

  // ✅ Resolve the “selected token contract” from context.
  // Update/trim these candidates to match your real model.
  const tokenContract: spCoinAccount | undefined =
    (ex as any)?.tokenContract ??
    (ex as any)?.tokens?.activeToken ??
    (ex as any)?.activeTokenContract ??
    (ex as any)?.accounts?.tokenContractAccount ??
    (ex as any)?.accounts?.activeTokenContract ??
    undefined;

  // ✅ early return AFTER hooks
  if (!vTokenPanel) return null;

  // Empty state (fixed wording)
  if (!tokenContract) {
    return (
      <div id="TOKEN_CONTRACT_PANEL">
        <div className="p-4 text-sm text-slate-200">
          <p className="mb-2 font-semibold">No token contract selected.</p>
          <p className="m-0">Select a token contract to view its details.</p>
        </div>
      </div>
    );
  }

  const address = addressToText(tokenContract.address);
  const name = fallback(tokenContract.name);
  const symbol = fallback(tokenContract.symbol);
  const description = fallback(tokenContract.description);
  const logoURL = (tokenContract.logoURL ?? '').toString().trim();
  const website = (tokenContract.website ?? '').toString().trim();

  // If these are not applicable for token contracts, delete the rows entirely.
  const stakedBalance = 0;
  const pendingBalance = 0;

  const pillAddr = formatShortAddress(String(tokenContract.address ?? '').trim());

  const th = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300/80';
  const cell = 'px-3 py-3 text-sm align-middle';
  const zebraA = 'bg-[rgba(56,78,126,0.35)]';
  const zebraB = 'bg-[rgba(156,163,175,0.25)]';

  return (
    <div id="TOKEN_CONTRACT_PANEL">
      {/* Contract Address header pill */}
      {pillAddr ? (
        <div className="flex items-center gap-2 mb-2 text-sm text-slate-300/80">
          <span className="whitespace-nowrap">Token Contract:</span>
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 py-1 gap-2 bg-[#243056] text-[#5981F3] text-base w-full mb-0 rounded-[22px]">
            <span className="w-full text-center font-mono break-all">{pillAddr}</span>
          </div>
        </div>
      ) : null}

      <div className="mb-4 mt-0 overflow-x-auto overflow-y-auto rounded-xl border border-black">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className={`${msTableTw.theadRow} border-b border-black`}>
              <th scope="col" className={th}>
                Field Name
              </th>
              <th scope="col" className={th}>
                Value
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>address</td>
              <td className={`${zebraA} ${cell}`}>
                <span className="font-mono break-all">{fallback(address)}</span>
              </td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>logoURL</td>
              <td className={`${zebraB} ${cell}`}>
                {logoURL ? <span className="break-all text-xs text-slate-200">{logoURL}</span> : 'N/A'}
              </td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>name</td>
              <td className={`${zebraA} ${cell}`}>{name}</td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>symbol</td>
              <td className={`${zebraB} ${cell}`}>{symbol}</td>
            </tr>

            {/* If not relevant for token contracts, delete these two rows */}
            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>stakedBalance</td>
              <td className={`${zebraA} ${cell}`}>{stakedBalance}</td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraB} ${cell}`}>pendingBalance</td>
              <td className={`${zebraB} ${cell}`}>{pendingBalance}</td>
            </tr>

            <tr className="border-b border-black">
              <td className={`${zebraA} ${cell}`}>website</td>
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

            <tr>
              <td className={`${zebraB} ${cell}`}>description</td>
              <td className={`${zebraB} ${cell}`}>{description}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
