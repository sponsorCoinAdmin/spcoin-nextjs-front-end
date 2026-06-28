// File: components/views/RadioOverlayPanels/TokenPanel/index.tsx
'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { SP_COIN_DISPLAY, type TokenContract } from '@/lib/structure';
import { useBuyTokenContract, usePreviewTokenContract, usePreviewTokenSource, useSellTokenContract } from '@/lib/context/hooks';
import ReadOnlyMetaDataTable from '@/components/shared/ReadOnlyMetaDataTable';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_TOKEN_PANEL === 'true';
const debugLog = createDebugLogger('TokenPanel', DEBUG_ENABLED, false);
const emptyLog = createDebugLogger('TokenPanelEmpty', DEBUG_ENABLED, false);

type Props = { onClose?: () => void };

const fallback = (v: unknown) => {
  const s = (v ?? '').toString().trim();
  return s || 'N/A';
};

/**
 * TokenPanel
 * - Single gate: TOKEN_PANEL
 * - Displays info for the currently selected token contract (from context)
 */
export default function TokenPanel(_props: Props) {
  // ✅ Single visibility gate
  const vTokenPanel = usePanelVisible(SP_COIN_DISPLAY.TOKEN_PANEL);

  // ✅ Read child visibility directly (BUY_CONTRACT / SELL_CONTRACT)
  const vBuyToken = usePanelVisible(SP_COIN_DISPLAY.BUY_CONTRACT);
  const vSellToken = usePanelVisible(SP_COIN_DISPLAY.SELL_CONTRACT);
  const vTokenMetaData = usePanelVisible(SP_COIN_DISPLAY.TOKEN_META_DATA);
  const vTokenLogo = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LOGO);
  const vTokenList = usePanelVisible(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL);

  const { openPanel, closePanel } = usePanelTree();

  // ✅ Source of truth: use the same token hooks as the rest of the app
  const [sellToken] = useSellTokenContract();
  const [buyToken] = useBuyTokenContract();
  const [previewToken, setPreviewTokenContract] = usePreviewTokenContract();
  const [previewSource, setPreviewTokenSource] = usePreviewTokenSource();

  // A preview token being set always takes priority over buy/sell mode.
  const isPreviewMode = previewToken != null;

  // Preview takes priority over buy/sell so the info-icon hover path works
  // even when BUY_CONTRACT / SELL_CONTRACT flags are still active.
  const activeTokenSide = useMemo(() => {
    if (isPreviewMode) return 'TOKEN_META_DATA';
    if (vBuyToken) return 'BUY_CONTRACT';
    if (vSellToken) return 'SELL_CONTRACT';
    return 'NONE';
  }, [isPreviewMode, vBuyToken, vSellToken]);

  const tokenContract: TokenContract | undefined =
    activeTokenSide === 'TOKEN_META_DATA'
      ? previewToken
      : activeTokenSide === 'BUY_CONTRACT'
        ? buyToken
        : activeTokenSide === 'SELL_CONTRACT'
          ? sellToken
          : previewToken ?? buyToken ?? sellToken;

  useEffect(() => {
    if (!DEBUG_ENABLED) return;
    debugLog.log?.('[TokenPanel] state', {
      vTokenPanel,
      vBuyToken,
      vSellToken,
      isPreviewMode,
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
    isPreviewMode,
    activeTokenSide,
    buyToken?.address,
    sellToken?.address,
    previewToken?.address,
    tokenContract?.address,
  ]);

  const prevVisibleRef = useRef<boolean>(false);
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = vTokenPanel;
    if (!wasVisible || vTokenPanel) return;

    if (previewSource) {
      const next =
        previewSource === 'BUY'
          ? SP_COIN_DISPLAY.BUY_CONTRACT
          : previewSource === 'SELL'
            ? SP_COIN_DISPLAY.SELL_CONTRACT
            : null;
      if (next != null) {
        openPanel(next, 'TokenPanel:closePreview:restoreMode');
      } else {
        openPanel(SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL, 'TokenPanel:closePreview:openList');
      }
    }

    if (previewToken) setPreviewTokenContract(undefined);
    if (previewSource) setPreviewTokenSource(null);
  }, [
    vTokenPanel,
    previewToken,
    previewSource,
    openPanel,
    setPreviewTokenContract,
    setPreviewTokenSource,
  ]);

  // Auto-close when TOKEN_PANEL is open but has nothing to display.
  // This handles the persisted-state case: TOKEN_PANEL was open last session,
  // but previewToken is never persisted, so after a page refresh it would show
  // an empty panel forever. Since openPanel + setPreviewTokenContract are batched
  // (queueMicrotask), when an info-click opens TOKEN_PANEL with a preview token both
  // arrive in the same render — isPreviewMode is true — so this effect does NOT fire.
  useEffect(() => {
    if (!vTokenPanel) return;
    if (vTokenList) return;
    if (isPreviewMode || vBuyToken || vSellToken) return;
    closePanel(SP_COIN_DISPLAY.TOKEN_PANEL, 'TokenPanel:noContent->autoClose');
  }, [vTokenPanel, isPreviewMode, vBuyToken, vSellToken, vTokenList, closePanel]);

  const isVisible = vTokenPanel;

  // ✅ early return AFTER hooks
  if (!isVisible || vTokenList) return null;

  // Empty state (fixed wording)
  if (!tokenContract || (!vBuyToken && !vSellToken && !isPreviewMode)) {
    emptyLog.log?.('[empty]', {
      vTokenPanel,
      vBuyToken,
      vSellToken,
      isPreviewMode,
      activeTokenSide,
      buyTokenAddr: buyToken?.address,
      sellTokenAddr: sellToken?.address,
      previewTokenAddr: previewToken?.address,
    });
    const title = isPreviewMode
      ? 'No preview, buy or sell token selected.'
      : vSellToken
        ? 'No sell token contract selected.'
        : vBuyToken
          ? 'No buy token contract selected.'
          : 'No token contract selected.';
    const body = isPreviewMode
      ? 'Select a token to preview its details.'
      : vSellToken
        ? 'Select a sell token to view its details.'
        : vBuyToken
          ? 'Select a buy token to view its details.'
          : 'Select a token to view its details.';
    return (
      <div id="TOKEN_PANEL">
        <div className="p-4 text-sm text-slate-200 text-center">
          <p className="mb-2 font-semibold">{title}</p>
          <p className="m-0">{body}</p>
        </div>
      </div>
    );
  }

  const fullAddr = String(tokenContract.address ?? '').trim();
  const name = fallback(tokenContract.name);
  const symbol = fallback(tokenContract.symbol);
  const description = fallback((tokenContract as any)?.description);
  const logoURL = (tokenContract.logoURL ?? '').toString().trim();
  const website = ((tokenContract as any)?.website ?? '').toString().trim();

  const rows = [
    { label: 'Name', value: name },
    { label: 'Symbol', value: symbol },
    { label: 'Address', value: <span className="font-mono text-xs">{fullAddr || 'N/A'}</span> },
    {
      label: 'Website',
      value: website ? (
        <a href={website} target="_blank" rel="noopener noreferrer"
          className="underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200">
          {website}
        </a>
      ) : 'N/A',
    },
    {
      label: 'Logo URL',
      value: logoURL ? (
        <a href={logoURL} target="_blank" rel="noopener noreferrer"
          className="underline decoration-slate-400/60 underline-offset-2 hover:decoration-slate-200 text-xs text-slate-200">
          {logoURL}
        </a>
      ) : 'N/A',
    },
    { label: 'Description', value: description },
  ];

  return (
    <div id="TOKEN_PANEL">
      {vBuyToken && <div id="BUY_CONTRACT" className="hidden" aria-hidden="true" />}
      {vSellToken && <div id="SELL_CONTRACT" className="hidden" aria-hidden="true" />}
      {isPreviewMode && <div id="TOKEN_META_DATA_PREVIEW" className="hidden" aria-hidden="true" />}
      {(isPreviewMode || vTokenMetaData) && (
        <ReadOnlyMetaDataTable
          rows={rows}
          logoURL={logoURL}
          logoAlt={name}
          logoVisible={vTokenLogo && !!logoURL}
        />
      )}
    </div>
  );
}
