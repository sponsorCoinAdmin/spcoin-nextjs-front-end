// File: components/RecipientSelectTradingPanel.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import cog_png from '@/public/assets/miscellaneous/cog.png';

import { WalletAccount } from '@/lib/structure/types';
import { getPublicFileUrl } from '@/lib/spCoin/guiUtils';

// 🔒 Panel-tree enum (what the tree uses internally)
import { SP_COIN_DISPLAY as SP_TREE } from '@/lib/structure/exchangeContext/enums/spCoinDisplay';
// 🧪 Optional: generic barrel import to sanity-check enum identity at runtime
import { SP_COIN_DISPLAY as SP_GENERIC } from '@/lib/structure';

import RecipientConfigPanel from '../containers/RecipientConfigPanel';
import { useExchangeContext } from '@/lib/context';
import { RecipientSelectDropDown } from '../containers/AssetSelectDropDowns';
import { usePanelTree } from '@/lib/context/exchangeContext/hooks/usePanelTree';

const DEBUG =
  process.env.NEXT_PUBLIC_DEBUG_LOG_RECIPIENT_TRADING_PANEL === 'true' ||
  process.env.NEXT_PUBLIC_DEBUG_LOG_PANELS === 'true';

const RecipientSelectTradingPanel: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { isVisible, openPanel, closePanel } = usePanelTree();

  const recipientWallet: WalletAccount | undefined =
    exchangeContext.accounts.recipientAccount;

  const [siteExists, setSiteExists] = useState<boolean>(false);

  const toggleSponsorRateConfig = useCallback(() => {
    const parentId = SP_TREE.RECIPIENT_SELECT_PANEL;
    const cfgId = SP_TREE.RECIPIENT_CONFIG_PANEL;

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
      'RecipientSelectTradingPanel:clearRecipient'
    );
    closePanel(SP_TREE.RECIPIENT_SELECT_PANEL);
    openPanel(SP_TREE.ADD_SPONSORSHIP_BUTTON);
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

  // 🔍 Compute all relevant booleans once (so logs don't call isVisible repeatedly)
  const vis = useMemo(() => {
    const showPanel = isVisible(SP_TREE.RECIPIENT_SELECT_PANEL);
    // The two names that often get mixed up – log both:
    const addBtnRecipient = isVisible(SP_TREE.ADD_SPONSORSHIP_BUTTON);
    const addBtnSponsorship = isVisible(SP_TREE.MANAGE_SPONSORSHIPS_BUTTON);

    const trading = isVisible(SP_TREE.TRADING_STATION_PANEL);
    const buyList = isVisible(SP_TREE.BUY_SELECT_PANEL_LIST);
    const sellList = isVisible(SP_TREE.SELL_SELECT_PANEL_LIST);
    const configPanel = isVisible(SP_TREE.RECIPIENT_CONFIG_PANEL);

    return {
      showPanel,
      addBtnRecipient,
      addBtnSponsorship,
      trading,
      buyList,
      sellList,
      configPanel,
    };
  }, [isVisible]);

  // 🧾 Visibility rule: only the RECIPIENT_SELECT_PANEL flag controls this panel
  const selfVisible = vis.showPanel;

  // 🧪 Debug: enum identity + panel states (runs every render since vis changes cause rerender)
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log('[RecipientSelectTradingPanel] Enum identity check:', {
      same_ENUM_OBJECT: SP_TREE === (SP_GENERIC as any),
      ADD_SPONSORSHIP_BUTTON_equal:
        SP_TREE.ADD_SPONSORSHIP_BUTTON === SP_GENERIC.ADD_SPONSORSHIP_BUTTON,
      RECIPIENT_SELECT_PANEL_equal:
        SP_TREE.RECIPIENT_SELECT_PANEL === SP_GENERIC.RECIPIENT_SELECT_PANEL,
      MANAGE_SPONSORSHIPS_BUTTON_equal:
        SP_TREE.MANAGE_SPONSORSHIPS_BUTTON === SP_GENERIC.MANAGE_SPONSORSHIPS_BUTTON,
    });
    // eslint-disable-next-line no-console
    console.table({
      RECIPIENT_SELECT_PANEL: vis.showPanel,
      ADD_SPONSORSHIP_BUTTON: vis.addBtnRecipient,
      MANAGE_SPONSORSHIPS_BUTTON: vis.addBtnSponsorship,
      RECIPIENT_CONFIG_PANEL: vis.configPanel,
      TRADING_STATION_PANEL: vis.trading,
      BUY_SELECT_PANEL_LIST: vis.buyList,
      SELL_SELECT_PANEL_LIST: vis.sellList,
      selfVisible,
    });
  }

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
      <div id="recipientContainerDiv_ID" className="h-[90px]">
        <div className="absolute top-3 left-[11px] text-[14px] text-[#94a3b8]">
          You are sponsoring:
        </div>

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

      <RecipientConfigPanel />

      {DEBUG && (
        <div className="mt-2 p-2 text-xs bg-black/30 rounded">
          <div>
            <b>Debug:</b>{' '}
            RECIPIENT_SELECT_PANEL={String(vis.showPanel)} |{' '}
            ADD_SPONSORSHIP_BUTTON={String(vis.addBtnRecipient)} |{' '}
            MANAGE_SPONSORSHIPS_BUTTON={String(vis.addBtnSponsorship)} |{' '}
            RECIPIENT_CONFIG_PANEL={String(vis.configPanel)} |{' '}
            BUY_SELECT_PANEL_LIST={String(vis.buyList)} |{' '}
            SELL_SELECT_PANEL_LIST={String(vis.sellList)} |{' '}
            selfVisible={String(selfVisible)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientSelectTradingPanel;
