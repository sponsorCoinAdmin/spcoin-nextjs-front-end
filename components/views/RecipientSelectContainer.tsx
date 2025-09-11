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
// ⬇️ Replace legacy activeDisplay with panel-tree controls
import { usePanelTree } from "@/lib/context/exchangeContext/hooks/usePanelTree";

const RecipientSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { openOverlay, closeOverlays } = usePanelTree();

  const [recipientWallet, setRecipientWallet] = useState<WalletAccount | undefined>(
    exchangeContext.accounts.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);

  // Default URL if recipient website does not exist
  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientWallet?.address?.trim() ? `siteKey=${recipientWallet.address.trim()}` : "";
  const defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  // Open Sponsor Rate Config as an overlay (radio behavior with other overlays)
  const toggleSponsorRateConfig = useCallback(() => {
    openOverlay(SP_COIN_DISPLAY.SPONSOR_RATE_CONFIG_PANEL);
  }, [openOverlay]);

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

  // Clear recipient in global context and return to main trading (close overlays)
  const clearRecipient = useCallback(() => {
    setExchangeContext(prev => {
      const next = structuredClone(prev);
      next.accounts.recipientAccount = undefined;
      return next;
    }, 'RecipientSelectContainer:clearRecipient');

    closeOverlays(); // show Trading Station again
  }, [setExchangeContext, closeOverlays]);

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

      <SponsorRateConfigPanel />
    </>
  );
};

export default RecipientSelectContainer;
