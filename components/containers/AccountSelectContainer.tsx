"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";

import styles from "@/styles/Exchange.module.css";
import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount, SP_COIN_DISPLAY } from "@/lib/structure/types";
import SponsorRateConfig from "./SponsorRateConfig";
import { useExchangeContext } from '@/lib/context/contextHooks' // ✅ Use context
import RecipientSelect from "./AccountSelectDropDown";
import { displaySpCoinContainers, toggleSponsorRateConfig } from "@/lib/spCoin/guiControl";
import { getPublicFileUrl } from "@/lib/spCoin/guiUtils";

const AccountSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext(); // ✅ Access global context

  const [recipientAccount, setRecipientAccount] = useState<WalletAccount | undefined>(
    exchangeContext.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);

  useEffect(() => {
    // ✅ Update global ExchangeContext when recipientAccount changes
    if (exchangeContext.recipientAccount !== recipientAccount) {
      setExchangeContext(prev => ({
        ...prev,
        recipientAccount,
      }));
    }
  }, [recipientAccount, exchangeContext, setExchangeContext]);

  const closeRecipientSelect = useCallback(() => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON, exchangeContext);
    setRecipientAccount(undefined);
  }, []);

  // ✅ Default URL if recipient website does not exist
  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientAccount?.address?.trim() ? `siteKey=${recipientAccount.address.trim()}` : "";
  let defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  // ✅ Check if recipient's website exists
  useEffect(() => {
    const website = recipientAccount?.website;
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
  }, [recipientAccount?.website]); // Keep dependency array unchanged

  return (
    <>
      <div id="recipientContainerDiv_ID" className={classNames(styles.inputs, styles.AccountSelectContainer)}>
        <div className={styles.lineDivider}>-------------------------------------------------------------------</div>
        <div className={styles.yourRecipient}>You are sponsoring:</div>
        {recipientAccount && siteExists ? (
          <Link href={`Recipient?url=${recipientAccount.website}`} className={styles.recipientName}>
            {recipientAccount.name}
          </Link>
        ) : (
          <Link href={defaultStaticFileUrl} className={styles.recipientName}>
            {recipientAccount?.name || "No recipient selected"}
          </Link>
        )}
        <div className={styles.recipientSelect}>
          <RecipientSelect recipientAccount={recipientAccount} callBackWallet={setRecipientAccount} />
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

export default AccountSelectContainer;
