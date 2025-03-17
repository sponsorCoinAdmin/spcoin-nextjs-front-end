"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";

import styles from "@/styles/Exchange.module.css";
import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount, SP_COIN_DISPLAY } from "@/lib/structure/types";
import SponsorRateConfig from "./SponsorRateConfig";
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Use context
import RecipientSelect from "./AccountSelectDropDown";
import { displaySpCoinContainers, toggleSponsorRateConfig } from "@/lib/spCoin/guiControl";
import { getPublicFileUrl } from "@/lib/spCoin/utils";

const RecipientContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext(); // ✅ Access global context

  const [recipientWallet, setRecipientWallet] = useState<WalletAccount | undefined>(
    exchangeContext.recipientWallet
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);

  useEffect(() => {
    // ✅ Update global ExchangeContext when recipientWallet changes
    if (exchangeContext.recipientWallet !== recipientWallet) {
      setExchangeContext({
        ...exchangeContext,
        recipientWallet,
      });
    }
  }, [recipientWallet, exchangeContext, setExchangeContext]);

  const closeRecipientSelect = useCallback(() => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON, exchangeContext);
    setRecipientWallet(undefined);
  }, []);

  // ✅ Default URL if recipient website does not exist
  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientWallet?.address?.trim() ? `siteKey=${recipientWallet.address.trim()}` : "";
  let defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  // ✅ Check if recipient's website exists
  useEffect(() => {
    const website = recipientWallet?.website;
    if (website && website !== "N/A" && website.trim() !== "") {
      fetch(website, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setSiteExists(true); // Assume the site exists since we can't check response.ok
          console.log(`Site ${website} is reachable.`);
        })
        .catch((error) => {
          console.error(`ERROR: WalletContainer.Fetching ${website}:`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [recipientWallet?.website]); // Keep dependency array unchanged

  return (
    <>
      <div id="recipientContainerDiv_ID" className={classNames(styles.inputs, styles.RecipientContainer)}>
        <div className={styles.lineDivider}>-------------------------------------------------------------------</div>
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
          <RecipientSelect recipientWallet={recipientWallet} callBackWallet={setRecipientWallet} />
        </div>
        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
            width={20}
            height={20}
            alt="Settings"
            onClick={() => toggleSponsorRateConfig("SponsorRateConfig_ID", exchangeContext)}
          />
        </div>
        <div id="clearSponsorSelect" className={styles.clearSponsorSelect} onClick={closeRecipientSelect}>
          X
        </div>
      </div>
      <SponsorRateConfig />
    </>
  );
};

export default RecipientContainer;
