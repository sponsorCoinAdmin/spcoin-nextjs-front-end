// File: @/components/views/RadioOverlayPanels/TokenPanel/index.tsx
'use client';

import React, { useEffect, useMemo } from 'react';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { useBuyTokenContract, usePreviewTokenContract, useSellTokenContract } from '@/lib/context/hooks';

// ✅ Use the same table theme module used by AccountListRewardsPanel
import { msTableTw } from '@/components/views/RadioOverlayPanels/msTableTw';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_TOKEN_PANEL === 'true';
const debugLog = createDebugLogger('TokenPanel', DEBUG_ENABLED, false);
const emptyLog = createDebugLogger('TokenPanelEmpty', DEBUG_ENABLED, false);

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

  // ✅ Read child visibility directly (BUY_TOKEN / SELL_TOKEN)
  const vBuyToken = usePanelVisible(SP_COIN_DISPLAY.BUY_TOKEN);
  const vSellToken = usePanelVisible(SP_COIN_DISPLAY.SELL_TOKEN);
  const vPreviewToken = usePanelVisible(SP_COIN_DISPLAY.PREVIEW_TOKEN);
  const vTokenList = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);

  const { openPanel, closePanel } = usePanelTree();

  // ✅ Source of truth: use the same token hooks as the rest of the app
  const [sellToken] = useSellTokenContract();
  const [buyToken] = useBuyTokenContract();
  const [previewToken, setPreviewTokenContract] = usePreviewTokenContract();

  // ✅ Resolve active token side from visible child flags
  const activeTokenSide = useMemo(() => {
    if (vPreviewToken) return 'PREVIEW_TOKEN';
    if (vBuyToken) return 'BUY_TOKEN';
    if (vSellToken) return 'SELL_TOKEN';
    return 'NONE';
  }, [vPreviewToken, vBuyToken, vSellToken]);

  const tokenContract: TokenContract | undefined =
    activeTokenSide === 'PREVIEW_TOKEN'
      ? previewToken
      : activeTokenSide === 'BUY_TOKEN'
        ? buyToken
        : activeTokenSide === 'SELL_TOKEN'
          ? sellToken
          : previewToken ?? buyToken ?? sellToken;

  useEffect(() => {
    if (!DEBUG_ENABLED) return;
    debugLog.log?.('[TokenPanel] state', {
      vTokenPanel,
      vBuyToken,
      vSellToken,
      vPreviewToken,
      activeTokenSide,
      buyTokenAddr: buyToken?.address,
      sellTokenAddr: sellToken?.address,
      previewTokenAddr: previewToken?.address,
      resolvedAddr: tokenContract?.address,
    });
  }, [
    vTokenPanel,
    vBuyToken,
    vSellToken,
    vPreviewToken,
    activeTokenSide,
    buyToken?.address,
    sellToken?.address,
    previewToken?.address,
    tokenContract?.address,
  ]);

  useEffect(() => {
    if (vTokenPanel) return;
    if (!previewToken) return;
    setPreviewTokenContract(undefined);
  }, [vTokenPanel, previewToken, setPreviewTokenContract]);

  useEffect(() => {
    if (!vTokenPanel) return;
    if (!vPreviewToken) return;
    if (previewToken) return;
    if (vTokenList) return;
    openPanel(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, 'TokenPanel:missingPreview->openList');
    closePanel(SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL, 'TokenPanel:missingPreview->closeSelf');
  }, [vTokenPanel, vPreviewToken, previewToken, vTokenList, openPanel, closePanel]);

  const isVisible = vTokenPanel;

  // ✅ early return AFTER hooks
  if (!isVisible || vTokenList) return null;

  // Empty state (fixed wording)
  if (!tokenContract || (!vBuyToken && !vSellToken && !vPreviewToken)) {
    emptyLog.log?.('[empty]', {
      vTokenPanel,
      vBuyToken,
      vSellToken,
      vPreviewToken,
      activeTokenSide,
      buyTokenAddr: buyToken?.address,
      sellTokenAddr: sellToken?.address,
      previewTokenAddr: previewToken?.address,
    });
    const title = vPreviewToken
      ? 'No preview, buy or sell token selected.'
      : vSellToken
        ? 'No sell token contract selected.'
        : vBuyToken
          ? 'No buy token contract selected.'
          : 'No token contract selected.';
    const body = vPreviewToken
      ? 'Select a token to preview its details.'
      : vSellToken
        ? 'Select a sell token to view its details.'
        : vBuyToken
          ? 'Select a buy token to view its details.'
          : 'Select a token to view its details.';
    return (
      <div id="TOKEN_CONTRACT_PANEL">
        <div className="p-4 text-sm text-slate-200 text-center">
          <p className="mb-2 font-semibold">{title}</p>
          <p className="m-0">{body}</p>
        </div>
      </div>
    );
  }

  const address = addressToText(tokenContract.address);
  const name = fallback(tokenContract.name);
  const symbol = fallback(tokenContract.symbol);
  const description = fallback((tokenContract as any)?.description);
  const logoURL = (tokenContract.logoURL ?? '').toString().trim();
  const website = ((tokenContract as any)?.website ?? '').toString().trim();

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
              <td className={`${zebraB} ${cell}`}>TOKpendingBalance</td>
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
