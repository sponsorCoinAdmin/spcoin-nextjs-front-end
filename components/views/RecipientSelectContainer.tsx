'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { WalletAccount } from '@/lib/structure/types';
import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';
import { SP_COIN_DISPLAY } from '@/lib/structure';
import RecipientConfigPanel from '../containers/RecipientConfigPanel';
import { useExchangeContext } from '@/lib/context';
import { RecipientSelectDropDown } from '../containers/AssetSelectDropDowns';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const RecipientSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { isVisible, openPanel, closePanel } = usePanelTree();

  const [recipientWallet, setRecipientWallet] = useState<WalletAccount | undefined>(
    exchangeContext.accounts.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);

  const toggleSponsorRateConfig = useCallback(() => {
    const parentId = SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL;
    const cfgId = SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL;

    if (!isVisible(parentId)) openPanel(parentId);
    if (isVisible(cfgId)) {
      closePanel(cfgId);
    } else {
      openPanel(cfgId);
    }
  }, [isVisible, openPanel, closePanel]);

  const clearRecipient = useCallback(() => {
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        next.accounts.recipientAccount = undefined;
        return next;
      },
      'RecipientSelectContainer:clearRecipient'
    );
    closePanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [setExchangeContext, closePanel, openPanel]);

  useEffect(() => {
    const website = recipientWallet?.website?.trim();
    if (!website || website === 'N/A') {
      setSiteExists(false);
      return;
    }
    fetch(website, { method: 'HEAD', mode: 'no-cors' })
      .then(() => setSiteExists(true))
      .catch(() => setSiteExists(false));
  }, [recipientWallet?.website]);

  const selfVisible = isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
  if (!selfVisible) return null;

  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientWallet?.address?.trim()
    ? `siteKey=${recipientWallet.address.trim()}`
    : '';
  const defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

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
      <div
        id="recipientContainerDiv_ID" className="h-[90px]" >
        <div className="absolute top-3 left-[11px] text-[14px] text-[#94a3b8]">
          You are sponsoring:
        </div>

        {/* Recipient name link */}
        {recipientWallet && siteExists ? (
          <Link
            href={`Recipient?url=${recipientWallet.website}`}
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

        {/* Recipient select dropdown */}
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
          <RecipientSelectDropDown
            recipientAccount={recipientWallet}
            callBackAccount={setRecipientWallet}
          />
        </div>

        {/* Settings (cog) icon */}
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

        {/* Clear (X) */}
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

      {/* Visible when RECIPIENT_CONFIG_PANEL is open in the panel tree */}
      <RecipientConfigPanel />
    </div>
  );
};

export default RecipientSelectContainer;
