// File: components/containers/RecipientSelectContainer.tsx
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
  const { openPanel, activeMainOverlay } = usePanelTree();

  const [recipientWallet, setRecipientWallet] = useState<WalletAccount | undefined>(
    exchangeContext.accounts.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);

  // Only show this container when:
  // 1) We're on the Trading main overlay, and
  // 2) Inline radio flag says to show it
  const showRecipientContainer =
    activeMainOverlay === SP_COIN_DISPLAY.TRADING_STATION_PANEL &&
    (exchangeContext as any)?.settings?.ui?.showRecipientContainer === true;

  if (!showRecipientContainer) return null;

  // Default URL if recipient website does not exist
  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientWallet?.address?.trim()
    ? `siteKey=${recipientWallet.address.trim()}`
    : "";
  const defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  // Open Sponsor Rate Config (non-main panel; does not affect activeMainOverlay)
  const toggleSponsorRateConfig = useCallback(() => {
    openPanel(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
  }, [openPanel]);

  // Check if recipient's website exists
  useEffect(() => {
    const website = recipientWallet?.website;
    if (website && website !== "N/A" && website.trim() !== "") {
      fetch(website, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setSiteExists(true); // Assume reachable (no-cors)
          console.log(`Site ${website} is reachable.`);
        })
        .catch((error) => {
          console.error(`ERROR: WalletContainer.Fetching ${website}:`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [recipientWallet?.website]);

  // Clear recipient in global context and return to Trading main overlay.
  // Also flip inline radio back to show the Add button instead of this container.
  const clearRecipient = useCallback(() => {
    setExchangeContext(
      (prev) => {
        const next: any = structuredClone(prev);
        next.accounts.recipientAccount = undefined;
        next.settings = {
          ...(next.settings ?? {}),
          ui: {
            ...((next.settings as any)?.ui ?? {}),
            showRecipientContainer: false,
          },
        };
        return next;
      },
      'RecipientSelectContainer:clearRecipient'
    );

    // Ensure Trading is the active main overlay
    openPanel(SP_COIN_DISPLAY.TRADING_STATION_PANEL);
  }, [setExchangeContext, openPanel]);

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
            onClick={toggleSponsorRateConfig}
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

      {/* Non-main panel; visibility managed separately via openPanel/closePanel */}
      <SponsorRateConfigPanel />
    </>
  );
};

export default RecipientSelectContainer;
