// File: components/views/RecipientSelectContainer.tsx
'use client';

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import styles from "@/styles/Exchange.module.css";
import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount } from "@/lib/structure/types";
import { getPublicFileUrl } from "@/lib/spCoin/guiUtils";
import { SP_COIN_DISPLAY } from "@/lib/structure";
import SponsorRateConfigPanel from "../containers/SponsorRateConfigPanel";
import { useExchangeContext } from "@/lib/context";
import { RecipientSelectDropDown } from "../containers/AssetSelectDropDowns";
import { usePanelTree } from "@/lib/context/exchangeContext/hooks/usePanelTree";

const RecipientSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { isVisible, openPanel, closePanel } = usePanelTree();

  const [recipientWallet, setRecipientWallet] = useState<WalletAccount | undefined>(
    exchangeContext.accounts.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);

  // Toggle the Recipient Config panel (ensure parent is open first)
  const toggleSponsorRateConfig = useCallback(() => {
    const parentId = SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL;
    const cfgId   = SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL;

    // Ensure parent container is visible so child has somewhere to render
    if (!isVisible(parentId)) openPanel(parentId);

    // Toggle the child panel
    if (isVisible(cfgId)) {
      closePanel(cfgId);
    } else {
      openPanel(cfgId);
    }
  }, [isVisible, openPanel, closePanel]);

  // Clear recipient, close its panels, and keep Trading overlay active
  const clearRecipient = useCallback(() => {
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        next.accounts.recipientAccount = undefined;
        return next;
      },
      'RecipientSelectContainer:clearRecipient'
    );

    closePanel(SP_COIN_DISPLAY.RECIPIENT_CONFIG_PANEL);
    closePanel(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [setExchangeContext, closePanel, openPanel]);

  useEffect(() => {
    const website = recipientWallet?.website?.trim();
    if (!website || website === "N/A") {
      setSiteExists(false);
      return;
    }
    fetch(website, { method: "HEAD", mode: "no-cors" })
      .then(() => setSiteExists(true))
      .catch(() => setSiteExists(false));
  }, [recipientWallet?.website]);

  // Panel-tree–driven visibility (single source of truth)
  const selfVisible = isVisible(SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL);
  if (!selfVisible) return null;

  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientWallet?.address?.trim()
    ? `siteKey=${recipientWallet.address.trim()}`
    : "";
  const defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  return (
    <>
      <div
        id="recipientContainerDiv_ID"
        className={clsx(styles.inputs, styles.AccountSelectContainer)}
      >
        <div className={styles.yourRecipient}>You are sponsoring:</div>

        {recipientWallet && siteExists ? (
          <Link href={`Recipient?url=${recipientWallet.website}`} className={styles.recipientName}>
            {recipientWallet.name}
          </Link>
        ) : (
          <Link href={defaultStaticFileUrl} className={styles.recipientName}>
            {recipientWallet?.name || "No recipient selected"}
          </Link>
        )}

        <div className={styles.recipientSelect}>
          <RecipientSelectDropDown
            recipientAccount={recipientWallet}
            callBackAccount={setRecipientWallet}
          />
        </div>

        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
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
          className={styles.clearSponsorSelect}
          onClick={clearRecipient}
        >
          X
        </div>
      </div>

      {/* Visible when RECIPIENT_CONFIG_PANEL is open in the panel tree */}
      <SponsorRateConfigPanel />
    </>
  );
};

export default RecipientSelectContainer;
