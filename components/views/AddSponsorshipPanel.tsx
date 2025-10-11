// File: components/views/AddSponsorshipPanel.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { WalletAccount } from '@/lib/structure/types';
import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';

import ConfigSponsorshipPanel from '../containers/ConfigSponsorshipPanel';
import { RecipientSelectDropDown } from '../containers/AssetSelectDropDowns';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';
import { usePanelVisible } from '@/lib/context/exchangeContext/hooks/usePanelVisible';
import { usePanelTransitions } from '@/lib/context/exchangeContext/hooks/usePanelTransitions';
import { useExchangeContext } from '@/lib/context/hooks';

const TAB_STORAGE_KEY = 'header_open_tabs';
const RECIPIENT_TAB_HREF = '/RecipientSite';

// 🔔 Helper: open/persist the RecipientSite tab in the header
function openRecipientSiteTab() {
  try {
    const raw = sessionStorage.getItem(TAB_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(arr) ? Array.from(new Set([...arr, RECIPIENT_TAB_HREF])) : [RECIPIENT_TAB_HREF];
    sessionStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('header:add-tab', { detail: { href: RECIPIENT_TAB_HREF } }));
  }
}

const AddSponsorShipPanel: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { openPanel, closePanel } = usePanelTree();
  const { openConfigSponsorship, closeConfigSponsorship } = usePanelTransitions();

  const isVisible = usePanelVisible(SP_TREE.ADD_SPONSORSHIP_PANEL);
  const configVisible = usePanelVisible(SP_TREE.CONFIG_SPONSORSHIP_PANEL);
  const tradingVisible = usePanelVisible(SP_TREE.TRADING_STATION_PANEL);

  const recipientWallet: WalletAccount | undefined = exchangeContext.accounts.recipientAccount;

  const [siteExists, setSiteExists] = useState<boolean>(false);

  const toggleSponsorRateConfig = useCallback(() => {
    if (configVisible) closeConfigSponsorship();
    else openConfigSponsorship();
  }, [configVisible, openConfigSponsorship, closeConfigSponsorship]);

  const clearRecipient = useCallback(() => {
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        if (!next.accounts.recipientAccount) return prev;
        next.accounts.recipientAccount = undefined;
        return next;
      },
      'AddSponsorShipPanel:clearRecipient'
    );
    closePanel(SP_TREE.ADD_SPONSORSHIP_PANEL);
    openPanel(SP_TREE.ADD_SPONSORSHIP_BUTTON);
  }, [setExchangeContext, closePanel, openPanel]);

  useEffect(() => {
    if (isVisible && !tradingVisible) {
      openPanel(SP_TREE.TRADING_STATION_PANEL);
    }
  }, [isVisible, tradingVisible, openPanel]);

  useEffect(() => {
    const website = recipientWallet?.website?.trim();
    const ac = new AbortController();

    if (!website || website === 'N/A') {
      setSiteExists(false);
      return () => ac.abort();
    }

    fetch(website, { method: 'HEAD', mode: 'no-cors', signal: ac.signal })
      .then(() => setSiteExists(true))
      .catch(() => setSiteExists(false));

    return () => ac.abort();
  }, [recipientWallet?.website]);

  if (!isVisible) return null;

  const baseURL = getPublicFileUrl('assets/accounts/site-info.html');
  const sitekey = recipientWallet?.address?.trim() ? `siteKey=${recipientWallet.address.trim()}` : '';
  const defaultStaticFileUrl = `/RecipientSite?url=${baseURL}?${sitekey}`; // ⬅️ ensure leading slash

  return (
    <div
      className="
        pt-[8px]
        relative
        mb-[5px]
        rounded-t-[12px]
        rounded-b-[12px]
        overflow-hidden
        bg-[#1f2639] text-[#94a3b8]
      "
    >
      <div id="recipientContainerDiv_ID" className="h-[90px]">
        <div className="absolute top-3 left-[11px] text-[14px] text-[#94a3b8]">
          You are sponsoring:
        </div>

        {recipientWallet && siteExists ? (
          <Link
            href={`/RecipientSite?url=${encodeURIComponent(recipientWallet.website!)}`}
            onClick={openRecipientSiteTab}
            className="
              absolute top-[47px] left-[10px]
              min-w-[50px] h-[10px]
              text-[#94a3b8] text-[25px]
              pr-2 flex items-center justify-start gap-1
              cursor-pointer hover:text-[orange] transition-colors duration-200
            "
          >
            {recipientWallet.name}
          </Link>
        ) : (
          <Link
            href={defaultStaticFileUrl}
            onClick={openRecipientSiteTab}
            className="
              absolute top-[57px] left-[10px]
              min-w-[50px] h-[10px]
              text-[#94a3b8] text-[25px]
              pr-2 flex items-center justify-start gap-1
              cursor-pointer hover:text-[orange] transition-colors duration-200
            "
          >
            {recipientWallet?.name || 'No recipient selected'}
          </Link>
        )}

        <div
          className="
            absolute left-[160px]
            min-w-[50px] h-[25px]
            rounded-full
            flex items-center justify-start gap-1
            font-bold text-[17px] pr-2
            text-white bg-[#243056]
          "
        >
          <RecipientSelectDropDown recipientAccount={recipientWallet} />
        </div>

        <div>
          <Image
            src={cog_png}
            className="
              absolute right-[39px]
              object-contain
              text-[#51586f]
              inline-block
              transition-transform duration-300
              hover:rotate-[360deg] hover:cursor-pointer
            "
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
          id="clearSponsorSelect"
          className="
            pt-[12px]
            absolute -top-2 right-[15px]
            text-[#94a3b8]
            text-[20px]
            cursor-pointer
          "
          onClick={clearRecipient}
        >
          X
        </div>
      </div>

      <ConfigSponsorshipPanel />
    </div>
  );
};

export default AddSponsorShipPanel;
