// File: @/components/views/AddSponsorshipPanel.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Address } from 'viem';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import type { WalletAccount } from '@/lib/structure/types';
import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure';

import ConfigSponsorshipPanel from '../containers/ConfigSponsorshipPanel';
import { RecipientSelectDropDown } from '../containers/AssetSelectDropDowns';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { useExchangeContext, useBuyTokenContract } from '@/lib/context/hooks';
import { isSpCoin } from '@/lib/spCoin/coreUtils';

// ✅ REST helpers
import { fetchRecipientMeta, type RecipientMeta } from '@/lib/rest/recipientMeta';
import { resolveWallet } from '@/lib/rest/resolveWallet';

// ✅ ToDo overlay
import ToDo from '@/lib/utils/components/ToDo';

// ✅ Debug logger
import { createDebugLogger } from '@/lib/utils/debugLogger';

// ✅ New: overlay caller registry
import { setOverlayCaller } from '@/lib/context/exchangeContext/overlayReturnRegistry';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_ADD_SPONSORSHIP === 'true';
const debugLog = createDebugLogger('AddSponsorshipPanel', DEBUG_ENABLED);

const TAB_STORAGE_KEY = 'header_open_tabs';
const RECIPIENT_TAB_HREF = '/RecipientSite';

// 🔔 Helper: open/persist the RecipientSite tab in the header
function openRecipientSiteTab() {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr)
      ? Array.from(new Set([...arr, RECIPIENT_TAB_HREF]))
      : [RECIPIENT_TAB_HREF];
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('header:add-tab', { detail: { href: RECIPIENT_TAB_HREF } }),
    );
  }
}

const AddSponsorShipPanel: React.FC = () => {
  // ── Context / visibility ─────────────────────────────────────────────────────
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  // ✅ only openPanel / closePanel remain
  const { closePanel } = usePanelTree();

  // ✅ usePanelTransitions now exposes openOverlay / closeTop only
  const { openOverlay } = usePanelTransitions();

  // 🔹 Visible if ADD_SPONSORSHIP_PANEL OR STAKING_SPCOINS_PANEL is true
  const addVisible = usePanelVisible(SP_TREE.ADD_SPONSORSHIP_PANEL);
  const manageStakingVisible = usePanelVisible(SP_TREE.STAKING_SPCOINS_PANEL);
  const tradingVisible = usePanelVisible(SP_TREE.TRADING_STATION_PANEL);

  // 🔹 The overlay we care about for “return to caller”
  const recipientListVisible = usePanelVisible(SP_TREE.RECIPIENT_LIST_SELECT_PANEL);

  const configVisible = usePanelVisible(SP_TREE.CONFIG_SPONSORSHIP_PANEL);

  const [buyTokenContract] = useBuyTokenContract();

  const recipientWallet: WalletAccount | undefined =
    exchangeContext.accounts.recipientAccount;

  // ── State ────────────────────────────────────────────────────────────────────
  const [showToDo, setShowToDo] = useState<boolean>(true);
  const [recipientMeta, setRecipientMeta] = useState<RecipientMeta | undefined>(
    undefined,
  );

  // ── Debug: mount / wallet changes ────────────────────────────────────────────
  useEffect(() => {
    debugLog.log?.('mounted; resolveWallet typeof =', typeof resolveWallet);
    return () => debugLog.log?.('unmounted');
  }, []);

  useEffect(() => {
    if (!recipientWallet) return;
    debugLog.log?.('recipientWallet changed:', {
      address: recipientWallet.address,
      name: recipientWallet.name,
      symbol: recipientWallet.symbol,
      logoURL: recipientWallet.logoURL,
      website: (recipientWallet as any).website,
    });
  }, [recipientWallet?.address]);

  // 🧭 Register caller for RECIPIENT_LIST_SELECT_PANEL
  useEffect(() => {
    if (!recipientListVisible) return;

    let parent: SP_TREE | undefined;

    if (manageStakingVisible) {
      parent = SP_TREE.STAKING_SPCOINS_PANEL;
    } else if (tradingVisible) {
      parent = SP_TREE.TRADING_STATION_PANEL;
    }

    if (parent != null) {
      debugLog.log?.('Registering overlay caller for RECIPIENT_LIST_SELECT_PANEL', {
        parent: SP_TREE[parent],
      });
      setOverlayCaller(SP_TREE.RECIPIENT_LIST_SELECT_PANEL, parent);
    } else {
      debugLog.log?.(
        'RECIPIENT_LIST_SELECT_PANEL visible but no obvious parent; header will fall back to TRADING_STATION_PANEL',
      );
    }
  }, [recipientListVisible, manageStakingVisible, tradingVisible]);

  // Fetch wallet.json for selected recipient (from /public)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const addr = recipientWallet?.address?.trim();
      if (!addr) {
        debugLog.log?.('No recipient address; clearing recipientMeta');
        setRecipientMeta(undefined);
        return;
      }
      try {
        debugLog.log?.('Fetching recipientMeta for address:', addr);
        const meta = await fetchRecipientMeta(addr as Address);
        if (!cancelled) {
          debugLog.log?.('recipientMeta fetched:', meta || '(none)');
          setRecipientMeta(meta);
        }
      } catch (err: any) {
        debugLog.warn?.('recipientMeta get error:', err?.message || err);
        if (!cancelled) setRecipientMeta(undefined);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipientWallet?.address]);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const toggleSponsorRateConfig = useCallback(() => {
    debugLog.log?.('toggleSponsorRateConfig clicked; currently visible?', configVisible);

    if (configVisible) {
      closePanel(
        SP_TREE.CONFIG_SPONSORSHIP_PANEL,
        'AddSponsorshipPanel:toggleSponsorRateConfig(close CONFIG_SPONSORSHIP_PANEL)',
      );
    } else {
      openOverlay(SP_TREE.CONFIG_SPONSORSHIP_PANEL, {
        methodName: 'AddSponsorshipPanel:toggleSponsorRateConfig(open)',
      });
    }
  }, [configVisible, openOverlay, closePanel]);

  const closeAddSponsorshipPanel = useCallback(() => {
    debugLog.log?.('closeAddSponsorshipPanel clicked');

    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        if (!next.accounts.recipientAccount) return prev;
        next.accounts.recipientAccount = undefined;
        return next;
      },
      'AddSponsorShipPanel:closeAddSponsorshipPanel',
    );

    // ✅ Close specific panels (NOT pop-top)
    closePanel(
      SP_TREE.ADD_SPONSORSHIP_PANEL,
      'AddSponsorshipPanel:closeAddSponsorshipPanel(close ADD_SPONSORSHIP_PANEL)',
    );

    // Keep your existing intent (close STAKING panel conditionally)
    if (buyTokenContract && isSpCoin(buyTokenContract)) {
      closePanel(
        SP_TREE.STAKING_SPCOINS_PANEL,
        'AddSponsorshipPanel:closeAddSponsorshipPanel(optionalClose STAKING_SPCOINS_PANEL)',
      );
    }
  }, [setExchangeContext, closePanel, buyTokenContract]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const pageQueryUrl = useMemo(() => {
    const val =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('url')
        : null;
    if (val) debugLog.log?.('pageQueryUrl:', val);
    return val;
  }, []);

  const fallbackBase = useMemo(() => {
    const url = getPublicFileUrl('assets/accounts/site-info.html');
    debugLog.log?.('fallbackBase:', url);
    return url;
  }, []);

  const effectiveWebsite = useMemo(() => {
    const fallbackMeta: Pick<RecipientMeta, 'address' | 'website'> | undefined =
      recipientWallet?.address
        ? {
            address: recipientWallet.address as `0x${string}`,
            website: (recipientWallet as any).website,
          }
        : undefined;

    const resolved = resolveWallet({
      queryUrl: pageQueryUrl,
      recipientMeta: recipientMeta ?? fallbackMeta,
      connectedWebsite: exchangeContext.accounts?.activeAccount?.website ?? null,
      fallbackBaseUrl: fallbackBase,
    });

    debugLog.log?.('effectiveWebsite resolved →', resolved, {
      queryUrl: pageQueryUrl,
      recipientMeta,
      walletWebsite: (recipientWallet as any)?.website,
      connectedWebsite: exchangeContext.accounts?.activeAccount?.website,
      fallbackBase,
    });
    return resolved;
  }, [
    pageQueryUrl,
    recipientMeta,
    recipientWallet?.address,
    (recipientWallet as any)?.website,
    exchangeContext.accounts?.activeAccount?.website,
    fallbackBase,
  ]);

  const recipientSiteHref = useMemo(() => {
    const href = `/RecipientSite?url=${encodeURIComponent(effectiveWebsite)}`;
    debugLog.log?.('recipientSiteHref:', href);
    return href;
  }, [effectiveWebsite]);

  const linkTopClass = useMemo(
    () =>
      recipientWallet?.name
        ? 'absolute top-[47px] left-[10px]'
        : 'absolute top-[57px] left-[10px]',
    [recipientWallet?.name],
  );

  // ── Only now is it safe to early-return (after all hooks have been called) ───
  const isVisible = addVisible || manageStakingVisible;
  if (!isVisible) return null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      id="AddSponsorshipPanel"
      className="
        pt-[8px]
        relative
        mb-[5px]
        rounded-t-[12px]
        rounded-b-[12px]
        overflow-hidden
        bg-[#1f2639] text-[#94a3b8]"
    >
      <div className="h-[90px]">
        <div className="absolute top-3 left-[11px] text-[14px] text-[#94a3b8]">
          You are sponsoring:
        </div>

        <div id="OpenRecipientSite">
          <Link
            href={recipientSiteHref}
            onClick={() => {
              debugLog.log?.('Link clicked → opening RecipientSite tab for:', recipientSiteHref);
              openRecipientSiteTab();
            }}
            className={`${linkTopClass} min-w-[50px] h-[10px] text-[#94a3b8] text-[25px] pr-2 flex items-center justify-start gap-1 cursor-pointer hover:text-[orange] transition-colors duration-200`}
          >
            {recipientWallet?.name || 'No recipient selected'}
          </Link>
        </div>

        <div className="absolute left-[160px] min-w-[50px] h-[25px] rounded-full flex items-center justify-start gap-1 font-bold text-[17px] pr-2 text-white bg-[#243056]">
          <RecipientSelectDropDown recipientAccount={recipientWallet} />
        </div>

        <div>
          <Image
            src={cog_png}
            className="absolute right-[39px] object-contain text-[#51586f] inline-block transition-transform duration-300 hover:rotate-[360deg] hover:cursor-pointer"
            width={20}
            height={20}
            alt="Settings"
            role="button"
            tabIndex={0}
            onClick={toggleSponsorRateConfig}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSponsorRateConfig();
              }
            }}
          />
        </div>

        <div
          id="closeAddSponsorshipPanel"
          className="pt-[12px] absolute -top-2 right-[15px] text-[#94a3b8] text-[20px] cursor-pointer"
          onClick={closeAddSponsorshipPanel}
        >
          X
        </div>
      </div>

      <ConfigSponsorshipPanel />

      {showToDo && (
        <ToDo
          show
          message="ToDo"
          opacity={0.5}
          color="#ff1a1a"
          zIndex={2000}
          onDismiss={() => setShowToDo(false)}
        />
      )}
    </div>
  );
};

export default AddSponsorShipPanel;
