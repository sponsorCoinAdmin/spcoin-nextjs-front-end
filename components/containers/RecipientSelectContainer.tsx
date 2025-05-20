// File : components\containers\AccountSelectContainer.tsx

'use client';

import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/Exchange.module.css";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames"; // ✅ Safe fallback import

import cog_png from "@/public/assets/miscellaneous/cog.png";

import { WalletAccount, SP_COIN_DISPLAY } from "@/lib/structure/types";
import SponsorRateConfig from "./SponsorRateConfig";
import { useExchangeContext } from '@/lib/context/contextHooks';
import RecipientSelectDropDown from "./RecipientSelectDropDown";
import { useSpCoinDisplay } from '@/lib/context/contextHooks';
import { useDisplaySpCoinContainers } from "@/lib/spCoin/guiControl";
import { getPublicFileUrl } from "@/lib/spCoin/guiUtils";

const AccountSelectContainer: React.FC = () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext();

  const [recipientAccount, setRecipientAccount] = useState<WalletAccount | undefined>(
    exchangeContext.recipientAccount
  );
  const [siteExists, setSiteExists] = useState<boolean>(false);
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  // 🧩 Sync DOM visibility with spCoinDisplay
  useDisplaySpCoinContainers(spCoinDisplay);

  useEffect(() => {
    if (exchangeContext.recipientAccount !== recipientAccount) {
      setExchangeContext(prev => ({
        ...prev,
        recipientAccount,
      }));
    }
  }, [recipientAccount, exchangeContext, setExchangeContext]);

  const closeRecipientSelectDropDown = useCallback(() => {
    setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_ADD_SPONSOR_BUTTON);
    setRecipientAccount(undefined);
  }, [setSpCoinDisplay]);

  const baseURL: string = getPublicFileUrl(`assets/accounts/site-info.html`);
  const sitekey = recipientAccount?.address?.trim() ? `siteKey=${recipientAccount.address.trim()}` : "";
  let defaultStaticFileUrl = `Recipient?url=${baseURL}?${sitekey}`;

  useEffect(() => {
    const website = recipientAccount?.website;
    if (website && website !== "N/A" && website.trim() !== "") {
      fetch(website, { method: "HEAD", mode: "no-cors" })
        .then(() => {
          setSiteExists(true);
          console.log(`Site ${website} is reachable.`);
        })
        .catch((error) => {
          console.error(`ERROR: WalletContainer.Fetching ${website}:`, error);
          setSiteExists(false);
        });
    } else {
      setSiteExists(false);
    }
  }, [recipientAccount?.website]);

   const toggleSponsorRateConfig = () => {
    if(spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER) {
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG);
    }
    else {
      setSpCoinDisplay(SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER)
    }
  };

  return (
    <>
      <div
        id="recipientContainerDiv_ID"
        className={classNames(
          styles.inputs,
          styles.AccountSelectContainer,
          spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG
            ? styles.noBottomRadius
            : styles.withBottomRadius
        )}
      >
        <div className={styles.lineDivider}></div>
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
          <RecipientSelectDropDown recipientAccount={recipientAccount} callBackAccount={setRecipientAccount} />
        </div>
        <div>
          <Image
            src={cog_png}
            className={styles.cogImg}
            width={20}
            height={20}
            alt="Settings"
            onClick={() => toggleSponsorRateConfig()}
          />
        </div>
        <div id="clearSponsorSelect" className={styles.clearSponsorSelect} onClick={closeRecipientSelectDropDown}>
          X
        </div>
      </div>
      {spCoinDisplay === SP_COIN_DISPLAY.SHOW_SPONSOR_RATE_CONFIG && (
        <div>
          <SponsorRateConfig />
        </div>
      )}
    </>
  );
};

export default AccountSelectContainer;
