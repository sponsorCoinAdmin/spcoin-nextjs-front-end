"use client";

import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/Exchange.module.css";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";

import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount, SP_COIN_DISPLAY } from "@/lib/structure/types";
import SponsorRateConfig from "./SponsorRateConfig";
import { useExchangeContext } from '@/lib/context/contextHooks';
import RecipientSelect from "./AccountSelectDropDown";
import { useSpCoinHandlers } from "@/lib/spCoin/guiControl";
import { getPublicFileUrl } from "@/lib/spCoin/guiUtils";

const AccountSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const { displaySpCoinContainers, toggleSponsorRateConfig } = useSpCoinHandlers();

  const [siteExists, setSiteExists] = useState<boolean>(false);
  const recipientAccount = exchangeContext.recipientAccount;

  const setRecipientAccount = useCallback((wallet: WalletAccount | undefined) => {
    if (wallet?.address !== exchangeContext.recipientAccount?.address) {
      setExchangeContext(prev => ({
        ...prev,
        recipientAccount: wallet,
      }));
    }
  }, [exchangeContext.recipientAccount?.address, setExchangeContext]);

  const closeRecipientSelect = useCallback(() => {
    displaySpCoinContainers(SP_COIN_DISPLAY.SELECT_BUTTON);
    setRecipientAccount(undefined);
  }, [displaySpCoinContainers, setRecipientAccount]);

  const baseURL = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientAccount?.address?.trim() ? `siteKey=${recipientAccount.address.trim()}` : "";
  const defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  useEffect(() => {
    const website = recipientAccount?.website;
    if (website && website !== "N/A" && website.trim() !== "") {
      fetch(website, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setSiteExists(true);
          console.log(`✅ Site ${website} is reachable.`);
        })
        .catch((error) => {
          console.error(`❌ ERROR fetching ${website}:`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [recipientAccount?.website]);

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
            onClick={() => toggleSponsorRateConfig("SponsorRateConfig_ID")}
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
